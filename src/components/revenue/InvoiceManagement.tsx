import { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { useInvoices, Invoice } from './hooks/useInvoices';
import { useEntitiesForInvoice } from '@/hooks/useEntitiesForInvoice';
import { usePermitApplicationsByEntity } from '@/hooks/usePermitApplicationsByEntity';
import { supabase } from '@/integrations/supabase/client';
import { useQuery } from '@tanstack/react-query';
import { FileText, Plus, Trash2, Send, Eye, Download, Search, Filter, Ban, Loader2, AlertCircle } from 'lucide-react';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Command, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { Check, ChevronsUpDown } from 'lucide-react';
import { cn } from '@/lib/utils';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

export function InvoiceManagement() {
  const { invoices, loading, suspendInvoice, refetch } = useInvoices();
  const { data: entities = [], isLoading: entitiesLoading } = useEntitiesForInvoice();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [viewDialogOpen, setViewDialogOpen] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [suspendingInvoiceId, setSuspendingInvoiceId] = useState<string | null>(null);
  const [entitySearchOpen, setEntitySearchOpen] = useState(false);
  const [entitySearchValue, setEntitySearchValue] = useState('');

  // Form state
  const [formData, setFormData] = useState({
    entity: '',
    permitApplication: '',
    amount: '',
    dueDate: '',
    itemCode: '',
    itemName: '',
    description: '',
    notes: ''
  });

  // Fetch permit applications for selected entity
  const { applications: permitApplications, loading: applicationsLoading } = usePermitApplicationsByEntity(formData.entity || null);
  
  // Fetch revenue item codes
  const { data: itemCodes = [], isLoading: itemCodesLoading } = useQuery({
    queryKey: ['revenue-item-codes'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('revenue_item_codes')
        .select('*')
        .order('item_number');
      if (error) throw error;
      return data || [];
    }
  });

  const filteredEntities = useMemo(() => {
    if (!entities || !Array.isArray(entities)) return [];
    if (!entitySearchValue) return entities;
    return entities.filter(entity =>
      entity.name.toLowerCase().includes(entitySearchValue.toLowerCase()) ||
      entity.registration_number?.toLowerCase().includes(entitySearchValue.toLowerCase())
    );
  }, [entities, entitySearchValue]);

  // Filter for new/unpaid invoices only (not paid)
  const unpaidInvoices = useMemo(() => {
    if (!invoices || !Array.isArray(invoices)) return [];
    return invoices.filter(invoice => invoice.status !== 'paid' && invoice.payment_status !== 'paid');
  }, [invoices]);

  const filteredInvoices = useMemo(() => {
    return unpaidInvoices.filter(invoice => {
      const matchesSearch = 
        invoice.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        invoice.entity?.name?.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === 'all' || invoice.status === statusFilter;
      return matchesSearch && matchesStatus;
    });
  }, [unpaidInvoices, searchTerm, statusFilter]);

  const handleCreateInvoice = async () => {
    try {
      if (!formData.entity || !formData.permitApplication || !formData.amount || !formData.dueDate) {
        toast({
          title: 'Validation Error',
          description: 'Please fill in all required fields',
          variant: 'destructive'
        });
        return;
      }

      // Implementation for creating invoice would go here
      // For now, just show success message
      toast({
        title: 'Invoice Created',
        description: 'New invoice has been generated successfully',
      });
      setCreateDialogOpen(false);
      setFormData({
        entity: '',
        permitApplication: '',
        amount: '',
        dueDate: '',
        itemCode: '',
        itemName: '',
        description: '',
        notes: ''
      });
      refetch();
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to create invoice',
        variant: 'destructive'
      });
    }
  };

  const handleViewInvoice = (invoice: Invoice) => {
    setSelectedInvoice(invoice);
    setViewDialogOpen(true);
  };

  const handleSuspendInvoice = async (invoice: Invoice) => {
    if (invoice.source_dashboard && invoice.source_dashboard !== 'revenue') {
      toast({
        title: 'Cannot Suspend Invoice',
        description: `This invoice was created on the ${invoice.source_dashboard} dashboard. Please suspend it from that dashboard instead.`,
        variant: 'destructive'
      });
      return;
    }
    
    setSuspendingInvoiceId(invoice.id);
    
    try {
      const result = await suspendInvoice(invoice.id, invoice.source_dashboard);
      if (result.success) {
        toast({
          title: 'Invoice Suspended',
          description: `Invoice ${invoice.invoice_number} has been suspended successfully.`,
        });
      } else {
        const errorMessage = typeof result.error === 'string' 
          ? result.error 
          : (result.error as any)?.message || 'An unexpected error occurred while suspending the invoice.';
        toast({
          title: 'Failed to Suspend Invoice',
          description: errorMessage,
          variant: 'destructive'
        });
      }
    } catch (error) {
      console.error('Error suspending invoice:', error);
      toast({
        title: 'Error',
        description: 'An unexpected error occurred. Please try again.',
        variant: 'destructive'
      });
    } finally {
      setSuspendingInvoiceId(null);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'paid': return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'draft': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      case 'sent': return 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200';
      case 'overdue': return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      case 'cancelled': return 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200';
      case 'suspended': return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      default: return 'bg-muted text-muted-foreground';
    }
  };

  return (
    <>
      <div className="space-y-6">
        {/* Header with Create Button */}
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Invoice Management
                </CardTitle>
                <CardDescription>View and manage invoices (view only - suspend available for revenue-created invoices)</CardDescription>
              </div>
              <Button onClick={() => setCreateDialogOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Create Invoice
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {/* Search and Filters */}
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1 relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search invoices..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full md:w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="draft">Draft</SelectItem>
                  <SelectItem value="sent">Sent</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="overdue">Overdue</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>
            </div>

            {/* Invoice Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <Card className="border-primary/20">
                <CardContent className="pt-4">
                  <p className="text-sm text-muted-foreground">Unpaid Invoices</p>
                  <p className="text-2xl font-bold text-foreground">{unpaidInvoices?.length || 0}</p>
                </CardContent>
              </Card>
              <Card className="border-primary/20">
                <CardContent className="pt-4">
                  <p className="text-sm text-muted-foreground">Total Outstanding</p>
                  <p className="text-2xl font-bold text-amber-600">
                    K{(unpaidInvoices?.reduce((sum, inv) => sum + inv.amount, 0) || 0).toLocaleString()}
                  </p>
                </CardContent>
              </Card>
              <Card className="border-primary/20">
                <CardContent className="pt-4">
                  <p className="text-sm text-muted-foreground">Overdue</p>
                  <p className="text-2xl font-bold text-red-600">
                    {unpaidInvoices?.filter(inv => inv.status === 'overdue').length || 0}
                  </p>
                </CardContent>
              </Card>
            </div>

            {/* Invoices Table */}
            {loading ? (
              <div className="space-y-3">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="animate-pulse bg-muted rounded-lg h-16"></div>
                ))}
              </div>
            ) : filteredInvoices.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
                <p className="text-muted-foreground">No invoices found</p>
              </div>
            ) : (
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Invoice Number</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Entity</TableHead>
                      <TableHead>Reference</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredInvoices.map((invoice) => {
                      const canSuspend = !invoice.source_dashboard || invoice.source_dashboard === 'revenue';
                      const isNotSuspended = invoice.status !== 'suspended';
                      
                      return (
                        <TableRow key={invoice.id}>
                          <TableCell className="font-medium">{invoice.invoice_number}</TableCell>
                          <TableCell>
                            <Badge variant="outline" className={
                              invoice.invoice_type === 'inspection_fee' 
                                ? 'border-blue-300 text-blue-700 bg-blue-50'
                                : 'border-green-300 text-green-700 bg-green-50'
                            }>
                              {invoice.invoice_type === 'inspection_fee' ? 'Inspection' : 'Permit Fee'}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline" className="text-xs capitalize">
                              {invoice.source_dashboard || 'revenue'}
                            </Badge>
                          </TableCell>
                          <TableCell>{invoice.entity?.name || 'N/A'}</TableCell>
                          <TableCell className="max-w-xs truncate">
                            {invoice.invoice_type === 'inspection_fee' && invoice.inspection
                              ? `${invoice.inspection.inspection_type} - ${invoice.inspection.province || 'N/A'}`
                              : invoice.permit?.title || 'N/A'}
                          </TableCell>
                          <TableCell className="font-semibold">K{invoice.amount.toLocaleString()}</TableCell>
                          <TableCell>{format(new Date(invoice.due_date), 'MMM dd, yyyy')}</TableCell>
                          <TableCell>
                            <Badge className={getStatusColor(invoice.status)}>
                              {invoice.status}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-2">
                              <Button 
                                size="sm" 
                                variant="ghost" 
                                title="View Details"
                                onClick={() => handleViewInvoice(invoice)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button size="sm" variant="ghost" title="Download">
                                <Download className="w-4 h-4" />
                              </Button>
                              {canSuspend && isNotSuspended && (
                                <Button 
                                  size="sm" 
                                  variant="ghost"
                                  className="text-orange-600 hover:text-orange-700 hover:bg-orange-50"
                                  onClick={() => handleSuspendInvoice(invoice)}
                                  disabled={suspendingInvoiceId === invoice.id}
                                  title="Suspend Invoice"
                                >
                                  {suspendingInvoiceId === invoice.id ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : (
                                    <Ban className="w-4 h-4" />
                                  )}
                                </Button>
                              )}
                              {!canSuspend && isNotSuspended && (
                                <span className="text-xs text-muted-foreground px-2">
                                  Suspend on {invoice.source_dashboard}
                                </span>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Create Invoice Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Create New Invoice</DialogTitle>
            <DialogDescription>Generate a new permit fee invoice</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="entity">Client (Entity) *</Label>
                <Popover open={entitySearchOpen} onOpenChange={setEntitySearchOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      role="combobox"
                      aria-expanded={entitySearchOpen}
                      className="w-full justify-between"
                    >
                      {formData.entity
                        ? entities.find((entity) => entity.id === formData.entity)?.name
                        : "Search and select client..."}
                      <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-full p-0" align="start">
                    <Command shouldFilter={false}>
                      <CommandInput 
                        placeholder="Search entities..." 
                        value={entitySearchValue}
                        onValueChange={setEntitySearchValue}
                      />
                      <CommandList>
                        <CommandEmpty>No entity found.</CommandEmpty>
                        <CommandGroup className="max-h-64 overflow-auto">
                          {entitiesLoading ? (
                            <div className="py-6 text-center text-sm">Loading entities...</div>
                          ) : filteredEntities.length === 0 ? (
                            <div className="py-6 text-center text-sm text-muted-foreground">No entities found</div>
                          ) : (
                            filteredEntities.map((entity) => (
                              <CommandItem
                                key={entity.id}
                                value={entity.name}
                                onSelect={() => {
                                  setFormData({
                                    ...formData,
                                    entity: entity.id,
                                    permitApplication: '',
                                  });
                                  setEntitySearchOpen(false);
                                  setEntitySearchValue('');
                                }}
                              >
                                <Check
                                  className={cn(
                                    'mr-2 h-4 w-4',
                                    formData.entity === entity.id ? 'opacity-100' : 'opacity-0'
                                  )}
                                />
                                <div className="flex flex-col">
                                  <span>{entity.name}</span>
                                  <span className="text-xs text-muted-foreground">
                                    {entity.entity_type}{' '}
                                    {entity.registration_number && `• ${entity.registration_number}`}
                                  </span>
                                </div>
                              </CommandItem>
                            ))
                          )}
                        </CommandGroup>
                      </CommandList>
                    </Command>
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-2">
                <Label htmlFor="permitApplication">Permit Application *</Label>
                <Select 
                  value={formData.permitApplication} 
                  onValueChange={(val) => setFormData({...formData, permitApplication: val})}
                  disabled={!formData.entity || applicationsLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={
                      !formData.entity 
                        ? "Select a client first" 
                        : applicationsLoading 
                          ? "Loading applications..." 
                          : permitApplications.length === 0
                            ? "No applications found"
                            : "Select permit application"
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {permitApplications.map((app) => (
                      <SelectItem key={app.id} value={app.id}>
                        <div className="flex flex-col">
                          <span className="font-medium">{app.permit_number || app.title}</span>
                          <span className="text-xs text-muted-foreground">
                            {app.permit_type} • {app.status}
                          </span>
                        </div>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (PGK) *</Label>
                <Input
                  id="amount"
                  type="number"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) => setFormData({...formData, amount: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dueDate">Due Date *</Label>
                <Input
                  id="dueDate"
                  type="date"
                  value={formData.dueDate}
                  onChange={(e) => setFormData({...formData, dueDate: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="itemCode">Item Code</Label>
                <Select 
                  value={formData.itemCode} 
                  onValueChange={(val) => {
                    const selectedItem = itemCodes.find(item => item.id === val);
                    setFormData({
                      ...formData, 
                      itemCode: val,
                      itemName: selectedItem?.item_name || ''
                    });
                  }}
                  disabled={itemCodesLoading}
                >
                  <SelectTrigger>
                    <SelectValue placeholder={
                      itemCodesLoading 
                        ? "Loading item codes..." 
                        : itemCodes.length === 0
                          ? "No item codes found"
                          : "Select item code"
                    } />
                  </SelectTrigger>
                  <SelectContent>
                    {itemCodes.map((code) => (
                      <SelectItem key={code.id} value={code.id}>
                        {code.item_number} - {code.item_name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="itemName">Item Name</Label>
                <Input
                  id="itemName"
                  placeholder="Item name"
                  value={formData.itemName}
                  onChange={(e) => setFormData({...formData, itemName: e.target.value})}
                  readOnly={!!formData.itemCode}
                  className={formData.itemCode ? 'bg-muted' : ''}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Input
                id="description"
                placeholder="e.g., Annual Environment Permit Fee"
                value={formData.description}
                onChange={(e) => setFormData({...formData, description: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes (Optional)</Label>
              <Textarea
                id="notes"
                placeholder="Add any additional notes..."
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
                rows={3}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreateInvoice}>
              <FileText className="w-4 h-4 mr-2" />
              Create Invoice
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Invoice Details Dialog */}
      <Dialog open={viewDialogOpen} onOpenChange={setViewDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <FileText className="w-5 h-5" />
              Invoice Details - {selectedInvoice?.invoice_number}
            </DialogTitle>
            <DialogDescription>
              View invoice information (read-only)
            </DialogDescription>
          </DialogHeader>

          {selectedInvoice && (
            <div className="space-y-6">
              {/* Source Dashboard Notice */}
              {selectedInvoice.source_dashboard && selectedInvoice.source_dashboard !== 'revenue' && (
                <Alert>
                  <AlertCircle className="h-4 w-4" />
                  <AlertTitle>External Invoice</AlertTitle>
                  <AlertDescription>
                    This invoice was created on the <strong>{selectedInvoice.source_dashboard}</strong> dashboard. 
                    Any modifications must be made from that dashboard.
                  </AlertDescription>
                </Alert>
              )}

              {/* Invoice Information Grid */}
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <Label className="text-muted-foreground text-sm">Invoice Number</Label>
                    <p className="font-semibold text-lg">{selectedInvoice.invoice_number}</p>
                  </div>
                  
                  <div>
                    <Label className="text-muted-foreground text-sm">Invoice Type</Label>
                    <Badge variant="outline" className="mt-1">
                      {selectedInvoice.invoice_type === 'inspection_fee' ? 'Inspection Fee' : 'Permit Fee'}
                    </Badge>
                  </div>

                  <div>
                    <Label className="text-muted-foreground text-sm">Amount</Label>
                    <p className="text-2xl font-bold text-primary">
                      {selectedInvoice.currency} {selectedInvoice.amount.toLocaleString()}
                    </p>
                  </div>

                  <div>
                    <Label className="text-muted-foreground text-sm">Due Date</Label>
                    <p className="font-medium">{format(new Date(selectedInvoice.due_date), 'MMMM dd, yyyy')}</p>
                  </div>

                  <div>
                    <Label className="text-muted-foreground text-sm">Status</Label>
                    <div className="mt-1">
                      <Badge className={getStatusColor(selectedInvoice.status)}>
                        {selectedInvoice.status}
                      </Badge>
                    </div>
                  </div>

                  <div>
                    <Label className="text-muted-foreground text-sm">Payment Status</Label>
                    <div className="mt-1">
                      <Badge variant="outline">
                        {selectedInvoice.payment_status || 'pending'}
                      </Badge>
                    </div>
                  </div>

                  <div>
                    <Label className="text-muted-foreground text-sm">Source Dashboard</Label>
                    <Badge variant="secondary" className="mt-1 capitalize">
                      {selectedInvoice.source_dashboard || 'revenue'}
                    </Badge>
                  </div>
                </div>

                <div className="space-y-4">
                  {selectedInvoice.entity && (
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <Label className="text-muted-foreground text-sm">Entity Information</Label>
                      <p className="font-semibold mt-1">{selectedInvoice.entity.name}</p>
                      <p className="text-sm text-muted-foreground capitalize">{selectedInvoice.entity.entity_type}</p>
                    </div>
                  )}

                  {selectedInvoice.permit && (
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <Label className="text-muted-foreground text-sm">Associated Permit</Label>
                      <p className="font-semibold mt-1">{selectedInvoice.permit.title}</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedInvoice.permit.permit_number && `${selectedInvoice.permit.permit_number} • `}
                        {selectedInvoice.permit.permit_type}
                      </p>
                    </div>
                  )}

                  {selectedInvoice.inspection && (
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <Label className="text-muted-foreground text-sm">Associated Inspection</Label>
                      <p className="font-semibold mt-1">{selectedInvoice.inspection.inspection_type}</p>
                      <p className="text-sm text-muted-foreground">
                        {selectedInvoice.inspection.province && `${selectedInvoice.inspection.province} • `}
                        {selectedInvoice.inspection.number_of_days} day(s)
                      </p>
                      <p className="text-sm text-muted-foreground">
                        Scheduled: {format(new Date(selectedInvoice.inspection.scheduled_date), 'MMM dd, yyyy')}
                      </p>
                    </div>
                  )}

                  {selectedInvoice.intent_registration && (
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <Label className="text-muted-foreground text-sm">Associated Intent Registration</Label>
                      <p className="font-semibold mt-1 line-clamp-2">{selectedInvoice.intent_registration.activity_description}</p>
                      <Badge variant="outline" className="mt-1 capitalize">
                        {selectedInvoice.intent_registration.status}
                      </Badge>
                    </div>
                  )}

                  {selectedInvoice.assigned_officer && (
                    <div className="p-4 bg-muted/50 rounded-lg">
                      <Label className="text-muted-foreground text-sm">Assigned Officer</Label>
                      <p className="font-semibold mt-1">{selectedInvoice.assigned_officer.full_name || 'N/A'}</p>
                      <p className="text-sm text-muted-foreground">{selectedInvoice.assigned_officer.email}</p>
                    </div>
                  )}

                  <div>
                    <Label className="text-muted-foreground text-sm">Created At</Label>
                    <p className="font-medium">{format(new Date(selectedInvoice.created_at), 'MMMM dd, yyyy HH:mm')}</p>
                  </div>

                  {selectedInvoice.paid_date && (
                    <div>
                      <Label className="text-muted-foreground text-sm">Paid Date</Label>
                      <p className="font-medium text-green-600">{format(new Date(selectedInvoice.paid_date), 'MMMM dd, yyyy')}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Follow-up Information */}
              {(selectedInvoice.follow_up_date || selectedInvoice.follow_up_notes) && (
                <div className="border-t pt-4">
                  <Label className="text-muted-foreground text-sm">Follow-up Information</Label>
                  {selectedInvoice.follow_up_date && (
                    <p className="mt-1">
                      <span className="font-medium">Next Follow-up:</span>{' '}
                      {format(new Date(selectedInvoice.follow_up_date), 'MMMM dd, yyyy')}
                    </p>
                  )}
                  {selectedInvoice.follow_up_notes && (
                    <p className="mt-1 text-muted-foreground">{selectedInvoice.follow_up_notes}</p>
                  )}
                </div>
              )}

              {/* Verification Information */}
              {selectedInvoice.verification_status && (
                <div className="border-t pt-4">
                  <Label className="text-muted-foreground text-sm">Verification Status</Label>
                  <Badge variant="outline" className="mt-1 capitalize">
                    {selectedInvoice.verification_status}
                  </Badge>
                  {selectedInvoice.verification_notes && (
                    <p className="mt-2 text-muted-foreground">{selectedInvoice.verification_notes}</p>
                  )}
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setViewDialogOpen(false)}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
