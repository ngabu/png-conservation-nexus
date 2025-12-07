import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { FileText, Calendar, Building, Clock, Search, Filter, MapPin, Shield, Receipt, UserCheck } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { formatDistanceToNow } from 'date-fns';
import {
  PermitSiteMappingTab,
  PermitRegistrationDetailsTab,
  PermitRegistryReviewTab,
  PermitComplianceReviewTab,
  PermitInvoicePaymentsTab,
  PermitMDReviewTab,
} from './permit-review';

interface PermitApplication {
  id: string;
  user_id: string;
  entity_id: string;
  title: string;
  description: string | null;
  permit_type: string;
  status: string;
  application_number: string | null;
  created_at: string;
  updated_at: string;
  activity_location?: string | null;
  estimated_cost_kina?: number | null;
  activity_classification?: string | null;
  activity_category?: string | null;
  activity_subcategory?: string | null;
  activity_level?: string | null;
  permit_period?: string | null;
  commencement_date?: string | null;
  completion_date?: string | null;
  entity_name?: string | null;
  entity_type?: string | null;
  coordinates?: any;
  project_boundary?: any;
  environmental_impact?: string | null;
  mitigation_measures?: string | null;
  compliance_checks?: any;
  uploaded_files?: any;
  project_description?: string | null;
  project_start_date?: string | null;
  project_end_date?: string | null;
  district?: string | null;
  province?: string | null;
  llg?: string | null;
  permit_specific_fields?: any;
  entity?: {
    id: string;
    name: string;
    entity_type: string;
  };
}

export function PermitApplicationReview() {
  const { toast } = useToast();
  const [applications, setApplications] = useState<PermitApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [selectedApplicationId, setSelectedApplicationId] = useState<string | null>(null);

  useEffect(() => {
    fetchApplications();
  }, []);

  const fetchApplications = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('permit_applications')
        .select(`
          *,
          entity:entities(id, name, entity_type)
        `)
        .not('status', 'eq', 'approved')
        .not('status', 'eq', 'draft')
        .order('created_at', { ascending: false });

      if (error) throw error;
      
      const mappedApplications: PermitApplication[] = (data || []).map(app => ({
        ...app,
        entity_name: app.entity?.name || app.entity_name || null,
        entity_type: app.entity?.entity_type || app.entity_type || null,
      }));
      
      setApplications(mappedApplications);
    } catch (error) {
      console.error('Error fetching permit applications:', error);
      toast({
        title: "Error",
        description: "Failed to fetch permit applications.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'submitted':
        return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300';
      case 'under_initial_review':
      case 'under_review':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
      case 'approved':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
      case 'rejected':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
      case 'requires_clarification':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const filteredApplications = applications.filter(app => {
    const matchesSearch = !searchTerm || 
      app.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.entity?.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.entity_name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      app.application_number?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const selectedApplication = applications.find(app => app.id === selectedApplicationId);

  if (loading) {
    return (
      <Card>
        <CardContent className="p-8">
          <div className="flex justify-center items-center">
            <Clock className="w-6 h-6 mr-2 animate-spin" />
            Loading permit applications...
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center">
                <FileText className="w-5 h-5 mr-2" />
                Permit Application Reviews ({filteredApplications.length})
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                Review and process permit applications submitted by applicants
              </p>
            </div>
            {selectedApplicationId && (
              <Button variant="outline" onClick={() => setSelectedApplicationId(null)}>
                Back to List
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {!selectedApplicationId && (
            <>
              {/* Filters */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 bg-muted/30 rounded-lg">
                <div>
                  <Label htmlFor="search">Search</Label>
                  <div className="relative">
                    <Search className="w-4 h-4 absolute left-3 top-3 text-muted-foreground" />
                    <Input
                      id="search"
                      placeholder="Search applications..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div>
                  <Label htmlFor="status">Status</Label>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger>
                      <SelectValue placeholder="All statuses" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Statuses</SelectItem>
                      <SelectItem value="submitted">Submitted</SelectItem>
                      <SelectItem value="under_initial_review">Under Initial Review</SelectItem>
                      <SelectItem value="under_review">Under Review</SelectItem>
                      <SelectItem value="rejected">Rejected</SelectItem>
                      <SelectItem value="requires_clarification">Requires Clarification</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="flex items-end">
                  <Button
                    variant="outline"
                    onClick={() => {
                      setSearchTerm('');
                      setStatusFilter('all');
                    }}
                    className="w-full"
                  >
                    <Filter className="w-4 h-4 mr-2" />
                    Clear Filters
                  </Button>
                </div>
              </div>

              {/* Applications List */}
              {filteredApplications.length === 0 ? (
                <div className="text-center py-12">
                  <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="text-lg font-medium mb-2">No permit applications found</h3>
                  <p className="text-muted-foreground">
                    {applications.length === 0 
                      ? "No permit applications have been submitted yet."
                      : "Try adjusting your filters to see more results."
                    }
                  </p>
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredApplications.map((app) => (
                    <Card 
                      key={app.id} 
                      className={`border-l-4 ${
                        app.status === 'submitted' ? 'border-l-blue-500' 
                        : app.status === 'approved' ? 'border-l-green-500'
                        : app.status === 'rejected' ? 'border-l-red-500'
                        : 'border-l-orange-500'
                      }`}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="space-y-2 flex-1">
                            <div className="flex items-center gap-2 flex-wrap">
                              <FileText className="w-4 h-4 text-blue-600" />
                              <h3 className="font-medium">{app.title}</h3>
                              <Badge className={getStatusColor(app.status)}>
                                {app.status.replace(/_/g, ' ')}
                              </Badge>
                              {app.application_number && (
                                <Badge variant="outline">{app.application_number}</Badge>
                              )}
                              {app.activity_level && (
                                <Badge variant="outline">Level {app.activity_level}</Badge>
                              )}
                            </div>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-muted-foreground">
                              <div className="flex items-center gap-1">
                                <Building className="w-4 h-4" />
                                <span>{app.entity?.name || app.entity_name || 'Unknown Entity'}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4" />
                                <span>Submitted: {formatDistanceToNow(new Date(app.created_at), { addSuffix: true })}</span>
                              </div>
                              <div className="flex items-center gap-1">
                                <FileText className="w-4 h-4" />
                                <span>Type: {app.permit_type}</span>
                              </div>
                            </div>
                          </div>
                          
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => setSelectedApplicationId(app.id)}
                          >
                            {app.status === 'submitted' ? 'Review' : 'View/Update'}
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      {/* Selected Application with Tabs */}
      {selectedApplication && (
        <Tabs defaultValue="site-mapping" className="space-y-4">
          <TabsList className="grid w-full grid-cols-6">
            <TabsTrigger value="site-mapping" className="flex items-center gap-1 text-xs">
              <MapPin className="w-3 h-3" />
              Site Mapping
            </TabsTrigger>
            <TabsTrigger value="registration" className="flex items-center gap-1 text-xs">
              <FileText className="w-3 h-3" />
              Registration
            </TabsTrigger>
            <TabsTrigger value="registry-review" className="flex items-center gap-1 text-xs">
              <FileText className="w-3 h-3" />
              Registry Review
            </TabsTrigger>
            <TabsTrigger value="compliance-review" className="flex items-center gap-1 text-xs">
              <Shield className="w-3 h-3" />
              Compliance
            </TabsTrigger>
            <TabsTrigger value="invoice-payments" className="flex items-center gap-1 text-xs">
              <Receipt className="w-3 h-3" />
              Invoices
            </TabsTrigger>
            <TabsTrigger value="md-review" className="flex items-center gap-1 text-xs">
              <UserCheck className="w-3 h-3" />
              MD Approval
            </TabsTrigger>
          </TabsList>

          <TabsContent value="site-mapping">
            <PermitSiteMappingTab application={selectedApplication} />
          </TabsContent>

          <TabsContent value="registration">
            <PermitRegistrationDetailsTab application={selectedApplication} />
          </TabsContent>

          <TabsContent value="registry-review">
            <PermitRegistryReviewTab 
              applicationId={selectedApplication.id}
              currentStatus={selectedApplication.status}
              onStatusUpdate={fetchApplications}
            />
          </TabsContent>

          <TabsContent value="compliance-review">
            <PermitComplianceReviewTab 
              applicationId={selectedApplication.id}
              currentStatus={selectedApplication.status}
              onStatusUpdate={fetchApplications}
            />
          </TabsContent>

          <TabsContent value="invoice-payments">
            <PermitInvoicePaymentsTab 
              applicationId={selectedApplication.id}
              entityId={selectedApplication.entity_id}
              onStatusUpdate={fetchApplications}
            />
          </TabsContent>

          <TabsContent value="md-review">
            <PermitMDReviewTab 
              applicationId={selectedApplication.id}
              currentStatus={selectedApplication.status}
              onStatusUpdate={fetchApplications}
            />
          </TabsContent>
        </Tabs>
      )}
    </div>
  );
}
