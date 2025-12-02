/**
 * Utility function for exporting intent registration details as PDF
 * Uses browser's print functionality with A4 formatting and consistent styling
 */
export const exportIntentRegistrationPDF = (
  setOpenSections?: React.Dispatch<React.SetStateAction<{
    registration: boolean;
    projectSite: boolean;
    stakeholder: boolean;
    financial: boolean;
  }>>
) => {
  // If section expansion callback provided, expand all sections before printing
  if (setOpenSections) {
    setOpenSections({
      registration: true,
      projectSite: true,
      stakeholder: true,
      financial: true,
    });
  }
  
  // Wait for sections to expand and DOM to update, then trigger print
  setTimeout(() => {
    window.print();
  }, 100);
};
