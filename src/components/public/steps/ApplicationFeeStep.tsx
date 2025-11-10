
import { FeeCalculationCard } from '@/components/fee-calculation/FeeCalculationCard';
import { useFeeCalculation, FeeCalculationParams } from '@/hooks/useFeeCalculation';
import { useEffect, useState, useRef } from 'react';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';
import { ChevronDown } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface ApplicationFeeStepProps {
  data: any;
  onChange: (data: any) => void;
}

export function ApplicationFeeStep({ data, onChange }: ApplicationFeeStepProps) {
  const { calculateFeesWithSupabase, loading, validateParameters } = useFeeCalculation();
  const [calculatedFees, setCalculatedFees] = useState(data.calculatedFees || null);
  const [calculationError, setCalculationError] = useState<string>('');
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const hasCalculatedOnce = useRef(false);

  const handleCalculateFees = async () => {
    setCalculationError('');
    setValidationErrors([]);
    
    const activityLevel = data.activity_level || '';
    const activityCategory = data.activity_category || '';
    const activitySubcategory = data.activity_subcategory || '';
    const prescribedActivityId = data.prescribed_activity_id || '';
    
    const params: FeeCalculationParams = {
      activityType: activityCategory || 'new',
      activitySubCategory: activitySubcategory || 'general',
      permitType: activityLevel,
      activityLevel: activityLevel,
      prescribedActivityId: prescribedActivityId,
      projectCost: data.estimated_cost_kina || undefined,
      landArea: data.land_area || undefined,
      durationYears: data.permit_period ? parseInt(data.permit_period) : undefined,
      odsDetails: data.ods_details || undefined,
      wasteDetails: data.waste_contaminant_details || undefined
    };

    const validation = validateParameters(params);
    if (!validation.isValid) {
      setValidationErrors(validation.errors);
      return;
    }

    try {
      const fees = await calculateFeesWithSupabase(params);
      
      if (fees) {
        setCalculatedFees(fees);
        hasCalculatedOnce.current = true;
        
        onChange({
          administration_fee: fees.administrationFee,
          technical_fee: fees.technicalFee,
          total_fee: fees.totalFee,
          fee_amount: fees.totalFee,
          processing_days: fees.processingDays,
          administration_form: fees.administrationForm,
          technical_form: fees.technicalForm,
          fee_source: fees.source,
          calculatedFees: fees,
          fee_breakdown: fees
        });
      }
    } catch (error) {
      console.error('Fee calculation error:', error);
      setCalculationError(error instanceof Error ? error.message : 'Unknown error occurred');
    }
  };

  // Auto-calculate only once when component mounts with required data
  useEffect(() => {
    const hasRequiredParams = data.activity_level && (data.activity_category || data.activity_subcategory);
    
    if (hasRequiredParams && !hasCalculatedOnce.current && !loading && !data.calculatedFees) {
      console.log('🔔 Auto-calculating fees on mount');
      handleCalculateFees();
    }
  }, []); // Empty dependency array - only run once on mount


  // Calculate multiplier details for display
  const getMultiplierBreakdown = () => {
    const breakdown: Array<{ label: string; value: string; applied: boolean }> = [];
    
    // Project cost multipliers
    if (data.estimated_cost_kina) {
      const cost = parseFloat(data.estimated_cost_kina);
      if (cost > 5000000) {
        breakdown.push({ label: 'Project Cost > K5M', value: '+50%', applied: true });
      } else if (cost > 1000000) {
        breakdown.push({ label: 'Project Cost > K1M', value: '+20%', applied: true });
      } else {
        breakdown.push({ label: 'Project Cost ≤ K1M', value: 'No multiplier', applied: false });
      }
    }
    
    // Land area multipliers
    if (data.land_area) {
      const area = parseFloat(data.land_area);
      if (area > 10000) {
        breakdown.push({ label: 'Land Area > 10,000 ha', value: '+30%', applied: true });
      } else if (area > 5000) {
        breakdown.push({ label: 'Land Area > 5,000 ha', value: '+15%', applied: true });
      } else {
        breakdown.push({ label: 'Land Area ≤ 5,000 ha', value: 'No multiplier', applied: false });
      }
    }
    
    // Duration multiplier
    if (data.commencement_date && data.completion_date) {
      const years = Math.ceil(
        (new Date(data.completion_date).getTime() - new Date(data.commencement_date).getTime()) / 
        (365 * 24 * 60 * 60 * 1000)
      );
      breakdown.push({ label: `Project Duration: ${years} year(s)`, value: `+${years * 30} processing days`, applied: true });
    }
    
    // ODS units
    if (data.ods_details?.units) {
      breakdown.push({ label: `ODS Units: ${data.ods_details.units}`, value: `+K${data.ods_details.units * 100}`, applied: true });
    }
    
    // Waste/Contaminant units
    if (data.waste_contaminant_details?.units) {
      breakdown.push({ label: `Waste/Contaminant Units: ${data.waste_contaminant_details.units}`, value: `+K${data.waste_contaminant_details.units * 50}`, applied: true });
    }
    
    return breakdown;
  };

  const [isBreakdownOpen, setIsBreakdownOpen] = useState(false);

  return (
    <div className="space-y-6">
      <FeeCalculationCard
          fees={calculatedFees}
          activityType={data.activity_category || 'General'}
          permitType={data.activity_level || ''}
          feeCategory="Based on prescribed activity"
          loading={loading}
          error={calculationError}
        />

        {calculatedFees && (
          <>
            <Collapsible open={isBreakdownOpen} onOpenChange={setIsBreakdownOpen}>
              <div className="border border-border rounded-lg overflow-hidden">
                <CollapsibleTrigger className="w-full p-4 bg-muted/50 hover:bg-muted transition-colors flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium text-foreground">Detailed Fee Calculation Breakdown</h4>
                    <Badge variant="outline">See multipliers</Badge>
                  </div>
                  <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${isBreakdownOpen ? 'rotate-180' : ''}`} />
                </CollapsibleTrigger>
                
                <CollapsibleContent>
                  <div className="p-4 space-y-4 bg-background">
                    <div className="space-y-3">
                      <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                        <span className="text-sm font-medium">Base Administration Fee</span>
                        <span className="text-sm">PGK {calculatedFees?.baseAdministrationFee?.toLocaleString() || '0'}</span>
                      </div>
                      
                      <div className="flex justify-between items-center p-3 bg-muted/30 rounded-lg">
                        <span className="text-sm font-medium">Base Technical Fee</span>
                        <span className="text-sm">PGK {calculatedFees?.baseTechnicalFee?.toLocaleString() || '0'}</span>
                      </div>
                    </div>

                    {getMultiplierBreakdown().length > 0 && (
                      <>
                        <div className="border-t pt-4">
                          <h5 className="text-sm font-semibold mb-3 text-foreground">Applied Multipliers & Adjustments</h5>
                          <div className="space-y-2">
                            {getMultiplierBreakdown().map((item, index) => (
                              <div 
                                key={index} 
                                className={`flex justify-between items-center p-2 rounded ${
                                  item.applied ? 'bg-primary/10' : 'bg-muted/20'
                                }`}
                              >
                                <span className="text-sm text-muted-foreground">{item.label}</span>
                                <Badge variant={item.applied ? "default" : "secondary"} className="text-xs">
                                  {item.value}
                                </Badge>
                              </div>
                            ))}
                          </div>
                        </div>
                      </>
                    )}

                    <div className="border-t pt-4 space-y-3">
                      <div className="flex justify-between items-center p-3 bg-primary/5 rounded-lg">
                        <span className="text-sm font-semibold">Final Administration Fee</span>
                        <span className="text-sm font-semibold text-primary">
                          PGK {calculatedFees?.administrationFee?.toLocaleString() || '0'}
                        </span>
                      </div>
                      
                      <div className="flex justify-between items-center p-3 bg-primary/5 rounded-lg">
                        <span className="text-sm font-semibold">Final Technical Fee</span>
                        <span className="text-sm font-semibold text-primary">
                          PGK {calculatedFees?.technicalFee?.toLocaleString() || '0'}
                        </span>
                      </div>
                    </div>

                    <div className="flex justify-between items-center p-4 bg-primary/10 rounded-lg border border-primary/20">
                      <span className="font-bold text-foreground">Total Fee</span>
                      <span className="font-bold text-lg text-primary">
                        PGK {calculatedFees?.totalFee?.toLocaleString() || '0'}
                      </span>
                    </div>

                    <div className="text-xs text-muted-foreground space-y-1 p-3 bg-muted/20 rounded">
                      <p>• Base fees calculated from Annual Recurrent Fee ÷ 365 × Processing Days</p>
                      <p>• Final fees split: 30% Administration / 70% Technical</p>
                      <p>• Processing days: {calculatedFees?.processingDays || 'N/A'} days</p>
                    </div>
                  </div>
                </CollapsibleContent>
              </div>
            </Collapsible>

            <div className="p-4 bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg">
              <h4 className="font-medium text-blue-800 dark:text-blue-300 mb-2">Payment Process:</h4>
              <ul className="text-sm text-blue-700 dark:text-blue-400 space-y-1">
                <li>• CEPA will issue fee notices using the specified forms</li>
                <li>• Administration fee calculated using: (Annual Recurrent Fee ÷ 365) × Processing Days</li>
                <li>• Technical fee is based on the work plan for assessment</li>
                <li>• All fees must be paid before CEPA begins assessment work</li>
                <li>• Fee notices will be signed by the Managing Director and bear CEPA's Common Seal</li>
                <li>• Activity type determines the specific forms and processing requirements</li>
              </ul>
            </div>
          </>
        )}
    </div>
  );
}
