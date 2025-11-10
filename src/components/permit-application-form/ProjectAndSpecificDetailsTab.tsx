import React from 'react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Building, Activity } from 'lucide-react';
import { EntityDropdownSelector } from '@/components/public/EntityDropdownSelector';

interface ProjectAndSpecificDetailsTabProps {
  formData: any;
  handleInputChange: (field: string, value: any) => void;
}

const ProjectAndSpecificDetailsTab: React.FC<ProjectAndSpecificDetailsTabProps> = ({ 
  formData, 
  handleInputChange 
}) => {
  return (
    <div className="space-y-6">
      {/* Project Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="w-5 h-5 text-primary" />
            Project Overview
          </CardTitle>
          <CardDescription>
            Provide detailed information about your project
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Entity Selection */}
          <EntityDropdownSelector
            selectedEntityId={formData.entity_id || null}
            onEntitySelect={(entityId, entityData) => {
              console.log('🏢 EntityDropdownSelector - onEntitySelect:', { entityId, entityData });
              handleInputChange('entity_id', entityId);
              if (entityData) {
                console.log('🏢 Setting entity data:', { 
                  entity_type: entityData.entity_type, 
                  entity_name: entityData.name 
                });
                handleInputChange('entity_type', entityData.entity_type);
                handleInputChange('entity_name', entityData.name);
              }
            }}
            onEntityCreate={() => {
              console.log('Entity created successfully');
            }}
          />

          <div>
            <Label htmlFor="applicationTitle">Application Title *</Label>
            <Input
              id="applicationTitle"
              value={formData.title || formData.applicationTitle || ''}
              onChange={(e) => {
                handleInputChange('title', e.target.value);
                handleInputChange('applicationTitle', e.target.value); // Keep both for compatibility
              }}
              placeholder="Enter a descriptive title for your application"
              required
            />
          </div>

          <div>
            <Label htmlFor="projectDescription">Project Description *</Label>
            <Textarea
              id="projectDescription"
              value={formData.projectDescription || ''}
              onChange={(e) => handleInputChange('projectDescription', e.target.value)}
              placeholder="Provide a detailed description of your project, including objectives, scope, and activities"
              rows={4}
              required
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="projectStartDate">Project Start Date *</Label>
              <Input
                id="projectStartDate"
                type="date"
                value={formData.projectStartDate || ''}
                onChange={(e) => handleInputChange('projectStartDate', e.target.value)}
                required
              />
            </div>
            <div>
              <Label htmlFor="projectEndDate">Project End Date</Label>
              <Input
                id="projectEndDate"
                type="date"
                value={formData.projectEndDate || ''}
                onChange={(e) => handleInputChange('projectEndDate', e.target.value)}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Environmental Assessment */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Activity className="w-5 h-5 text-primary" />
            Environmental Assessment
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div>
            <Label htmlFor="environmentalImpact">Environmental Impact Assessment *</Label>
            <Textarea
              id="environmentalImpact"
              value={formData.environmentalImpact || ''}
              onChange={(e) => handleInputChange('environmentalImpact', e.target.value)}
              placeholder="Describe the potential environmental impacts of your project"
              rows={3}
              required
            />
          </div>

          <div>
            <Label htmlFor="mitigationMeasures">Mitigation Measures *</Label>
            <Textarea
              id="mitigationMeasures"
              value={formData.mitigationMeasures || ''}
              onChange={(e) => handleInputChange('mitigationMeasures', e.target.value)}
              placeholder="Describe the measures you will implement to minimize environmental impacts"
              rows={3}
              required
            />
          </div>
        </CardContent>
      </Card>

    </div>
  );
};

export default ProjectAndSpecificDetailsTab;
