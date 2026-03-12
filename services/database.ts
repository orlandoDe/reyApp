import { supabase } from './supabase';
import { RepairJob, RepairStatus, RepairPart } from '../types';

// --- Type mappings between DB rows and app types ---

interface DbRepairJob {
  id: string;
  customer_name: string;
  customer_email: string;
  customer_phone: string;
  drone_manufacturer: string;
  drone_model: string;
  drone_serial_number: string;
  issue_description: string;
  ai_diagnosis: string | null;
  status: string;
  received_date: string;
  estimated_cost: number;
  is_paid: boolean;
  technician: string | null;
  technician_notes: string[];
  client_signature: string | null;
  notification_preferences: { sms: boolean; whatsapp: boolean; email: boolean } | null;
  created_at: string;
  is_deleted: boolean;
  is_hidden: boolean;
  updated_at: string;
  // Joined relations
  repair_parts?: DbRepairPart[];
  repair_images?: DbRepairImage[];
  timeline_entries?: DbTimelineEntry[];
}

interface DbRepairPart {
  id: number;
  repair_job_id: string;
  category: 'module' | 'part';
  name: string;
  part_number: string;
  is_warranty: boolean;
}

interface DbRepairImage {
  id: string;
  repair_job_id: string;
  storage_path: string;
  url: string;
}

interface DbTimelineEntry {
  id: string;
  repair_job_id: string;
  status: string;
  note: string | null;
  created_at: string;
}

// --- Converters ---

function dbJobToAppJob(row: DbRepairJob): RepairJob {
  return {
    id: row.id,
    customerName: row.customer_name,
    customerEmail: row.customer_email,
    customerPhone: row.customer_phone,
    drone: {
      manufacturer: row.drone_manufacturer,
      model: row.drone_model,
      serialNumber: row.drone_serial_number,
    },
    issueDescription: row.issue_description,
    aiDiagnosis: row.ai_diagnosis || undefined,
    status: row.status as RepairStatus,
    receivedDate: new Date(row.received_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
    estimatedCost: row.estimated_cost,
    isPaid: row.is_paid,
    technician: row.technician || undefined,
    technicianNotes: row.technician_notes || [],
    clientSignature: row.client_signature || undefined,
    isDeleted: row.is_deleted || false,
    isHidden: row.is_hidden || false,
    notificationPreferences: row.notification_preferences || { sms: false, whatsapp: false, email: false },
    images: (row.repair_images || []).map(img => img.url),
    parts: (row.repair_parts || []).map(p => ({
      id: p.id,
      category: p.category,
      name: p.name,
      partNumber: p.part_number,
      warranty: p.is_warranty,
    })),
    timeline: (row.timeline_entries || []).map(t => ({
      status: t.status as RepairStatus,
      date: new Date(t.created_at).toLocaleString(),
    })),
  };
}

// --- CRUD Operations ---

export async function fetchAllJobs(): Promise<RepairJob[]> {
  const { data, error } = await supabase
    .from('repair_jobs')
    .select(`
      *,
      repair_parts (*),
      repair_images (*),
      timeline_entries (*)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error fetching jobs:', error);
    return [];
  }

  return (data as DbRepairJob[]).map(dbJobToAppJob);
}

export async function createRepairJob(job: Omit<RepairJob, 'id'>): Promise<RepairJob | null> {
  // Insert the main job
  const { data: jobRow, error: jobError } = await supabase
    .from('repair_jobs')
    .insert({
      customer_name: job.customerName,
      customer_email: job.customerEmail,
      customer_phone: job.customerPhone,
      drone_manufacturer: job.drone.manufacturer,
      drone_model: job.drone.model,
      drone_serial_number: job.drone.serialNumber,
      issue_description: job.issueDescription,
      ai_diagnosis: job.aiDiagnosis || null,
      status: job.status,
      received_date: new Date().toISOString(),
      estimated_cost: job.estimatedCost,
      technician: job.technician || null,
      technician_notes: job.technicianNotes,
      client_signature: job.clientSignature || null,
      notification_preferences: job.notificationPreferences || null,
    })
    .select()
    .single();

  if (jobError || !jobRow) {
    console.error('Error creating job:', jobError);
    return null;
  }

  // Insert initial timeline entry
  await supabase.from('timeline_entries').insert({
    repair_job_id: jobRow.id,
    status: RepairStatus.RECEIVED,
  });

  // Insert images if any
  if (job.images && job.images.length > 0) {
    const imageRows = job.images.map(url => ({
      repair_job_id: jobRow.id,
      storage_path: url,
      url: url,
    }));
    await supabase.from('repair_images').insert(imageRows);
  }

  // Fetch the complete job with relations
  return fetchJobById(jobRow.id);
}

export async function fetchJobById(id: string): Promise<RepairJob | null> {
  const { data, error } = await supabase
    .from('repair_jobs')
    .select(`
      *,
      repair_parts (*),
      repair_images (*),
      timeline_entries (*)
    `)
    .eq('id', id)
    .single();

  if (error || !data) {
    console.error('Error fetching job:', error);
    return null;
  }

  return dbJobToAppJob(data as DbRepairJob);
}

export async function updateJobStatus(jobId: string, newStatus: RepairStatus, estimatedCost?: number): Promise<boolean> {
  const updates: Record<string, unknown> = {
    status: newStatus,
    updated_at: new Date().toISOString(),
  };
  if (estimatedCost !== undefined) {
    updates.estimated_cost = estimatedCost;
  }

  const { error: jobError } = await supabase
    .from('repair_jobs')
    .update(updates)
    .eq('id', jobId);

  if (jobError) {
    console.error('Error updating job status:', jobError);
    return false;
  }

  // Add timeline entry
  const { error: timelineError } = await supabase
    .from('timeline_entries')
    .insert({
      repair_job_id: jobId,
      status: newStatus,
    });

  if (timelineError) {
    console.error('Error adding timeline entry:', timelineError);
  }

  return true;
}

export async function addPartsToJob(jobId: string, parts: RepairPart[], isWarranty: boolean): Promise<boolean> {
  const rows = parts.map(p => ({
    repair_job_id: jobId,
    category: p.category,
    name: p.name,
    part_number: p.partNumber,
    is_warranty: isWarranty,
  }));

  const { error } = await supabase.from('repair_parts').insert(rows);

  if (error) {
    console.error('Error adding parts:', error);
    return false;
  }

  return true;
}

export async function addTechnicianNote(jobId: string, notes: string[]): Promise<boolean> {
  const { data: job, error: fetchError } = await supabase
    .from('repair_jobs')
    .select('technician_notes')
    .eq('id', jobId)
    .single();

  if (fetchError) {
    console.error('Error fetching notes:', fetchError);
    return false;
  }

  const existingNotes = (job?.technician_notes as string[]) || [];
  const { error } = await supabase
    .from('repair_jobs')
    .update({ technician_notes: [...existingNotes, ...notes] })
    .eq('id', jobId);

  if (error) {
    console.error('Error updating notes:', error);
    return false;
  }

  return true;
}

export async function addImageToJob(jobId: string, storagePath: string, publicUrl: string): Promise<boolean> {
  const { error } = await supabase.from('repair_images').insert({
    repair_job_id: jobId,
    storage_path: storagePath,
    url: publicUrl,
  });

  if (error) {
    console.error('Error adding image record:', error);
    return false;
  }

  return true;
}

export async function softDeleteJob(jobId: string): Promise<boolean> {
  const { error } = await supabase
    .from('repair_jobs')
    .update({ is_deleted: true, updated_at: new Date().toISOString() })
    .eq('id', jobId);

  if (error) {
    console.error('Error soft-deleting job:', error);
    return false;
  }
  return true;
}

export async function restoreDeletedJob(jobId: string): Promise<boolean> {
  const { error } = await supabase
    .from('repair_jobs')
    .update({ is_deleted: false, updated_at: new Date().toISOString() })
    .eq('id', jobId);

  if (error) {
    console.error('Error restoring deleted job:', error);
    return false;
  }
  return true;
}

export async function permanentDeleteJob(jobId: string): Promise<boolean> {
  // Delete related records first
  await supabase.from('repair_parts').delete().eq('repair_job_id', jobId);
  await supabase.from('repair_images').delete().eq('repair_job_id', jobId);
  await supabase.from('timeline_entries').delete().eq('repair_job_id', jobId);

  const { error } = await supabase
    .from('repair_jobs')
    .delete()
    .eq('id', jobId);

  if (error) {
    console.error('Error permanently deleting job:', error);
    return false;
  }
  return true;
}

export async function hideJob(jobId: string): Promise<boolean> {
  const { error } = await supabase
    .from('repair_jobs')
    .update({ is_hidden: true, updated_at: new Date().toISOString() })
    .eq('id', jobId);

  if (error) {
    console.error('Error hiding job:', error);
    return false;
  }
  return true;
}

export async function restoreHiddenJob(jobId: string): Promise<boolean> {
  const { error } = await supabase
    .from('repair_jobs')
    .update({ is_hidden: false, updated_at: new Date().toISOString() })
    .eq('id', jobId);

  if (error) {
    console.error('Error restoring hidden job:', error);
    return false;
  }
  return true;
}
