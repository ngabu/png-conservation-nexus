
import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

interface ComplianceStaff {
  id: string;
  email: string;
  full_name: string | null;
  role: string;
  operational_unit: string | null;
  staff_position: string | null;
  is_active: boolean | null;
  created_at: string | null;
}

export function useComplianceStaff() {
  const [staff, setStaff] = useState<ComplianceStaff[]>([]);
  const { profile } = useAuth();

  const fetchComplianceStaff = async () => {
    try {
      // Managers can see all officers including suspended; others only see active
      const isManagerOrAdmin = profile?.staff_position === 'manager' || 
                               profile?.staff_position === 'director' || 
                               profile?.user_type === 'super_admin';
      
      let query = supabase
        .from('profiles')
        .select('user_id, email, first_name, last_name, user_type, staff_unit, staff_position, is_active, created_at')
        .eq('staff_unit', 'compliance');
      
      if (!isManagerOrAdmin) {
        query = query.eq('is_active', true);
      }
      
      const { data, error } = await query;

      if (error) throw error;
      
      // Transform data to match expected interface
      const transformedData = (data || []).map(item => ({
        id: item.user_id,
        email: item.email,
        full_name: item.first_name && item.last_name 
          ? `${item.first_name} ${item.last_name}` 
          : item.first_name || item.last_name || null,
        role: item.user_type,
        operational_unit: item.staff_unit,
        staff_position: item.staff_position,
        is_active: item.is_active,
        created_at: item.created_at
      }));
      
      setStaff(transformedData);
    } catch (error) {
      console.error('Error fetching compliance staff:', error);
    }
  };

  useEffect(() => {
    if (profile?.staff_unit === 'compliance' || profile?.user_type === 'super_admin') {
      fetchComplianceStaff();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [profile?.staff_unit, profile?.user_type]);

  return { staff };
}
