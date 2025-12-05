import { useState } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { CalendarIcon } from 'lucide-react';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import { useAuth } from '@/contexts/AuthContext';

interface ComplianceStaff {
  id: string;
  email: string;
  full_name: string | null;
}

interface AssignTaskDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  officer: ComplianceStaff | null;
  onAssign: (taskData: {
    task_type: 'inspection' | 'intent_assessment' | 'permit_assessment';
    title: string;
    description: string;
    assigned_to: string;
    priority: 'low' | 'normal' | 'high' | 'urgent';
    due_date: string | null;
  }) => Promise<void>;
}

export function AssignTaskDialog({ open, onOpenChange, officer, onAssign }: AssignTaskDialogProps) {
  const { profile } = useAuth();
  const [taskType, setTaskType] = useState<'inspection' | 'intent_assessment' | 'permit_assessment'>('permit_assessment');
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<'low' | 'normal' | 'high' | 'urgent'>('normal');
  const [dueDate, setDueDate] = useState<Date | undefined>();
  const [loading, setLoading] = useState(false);

  const isSelfAssignment = officer?.id === profile?.user_id;

  const handleSubmit = async () => {
    if (!officer || !title) return;

    setLoading(true);
    try {
      await onAssign({
        task_type: taskType,
        title,
        description,
        assigned_to: officer.id,
        priority,
        due_date: dueDate ? dueDate.toISOString() : null,
      });
      
      // Reset form
      setTitle('');
      setDescription('');
      setTaskType('permit_assessment');
      setPriority('normal');
      setDueDate(undefined);
      onOpenChange(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{isSelfAssignment ? 'Create Task for Yourself' : 'Assign Task to Officer'}</DialogTitle>
          <DialogDescription>
            {isSelfAssignment 
              ? 'Create a new task assigned to yourself'
              : `Assign a task to ${officer?.full_name || officer?.email}`}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="task-type">Task Type</Label>
            <Select value={taskType} onValueChange={(v) => setTaskType(v as typeof taskType)}>
              <SelectTrigger>
                <SelectValue placeholder="Select task type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="inspection">Inspection</SelectItem>
                <SelectItem value="intent_assessment">Intent Assessment</SelectItem>
                <SelectItem value="permit_assessment">Permit Assessment</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="title">Task Title</Label>
            <Input
              id="title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter task title"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Enter task description"
              rows={3}
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="priority">Priority</Label>
              <Select value={priority} onValueChange={(v) => setPriority(v as typeof priority)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="urgent">Urgent</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Due Date</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "w-full justify-start text-left font-normal",
                      !dueDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {dueDate ? format(dueDate, "PPP") : "Pick a date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dueDate}
                    onSelect={setDueDate}
                    initialFocus
                    disabled={(date) => date < new Date()}
                  />
                </PopoverContent>
              </Popover>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={!title || loading}>
            {loading ? (isSelfAssignment ? 'Creating...' : 'Assigning...') : (isSelfAssignment ? 'Create Task' : 'Assign Task')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
