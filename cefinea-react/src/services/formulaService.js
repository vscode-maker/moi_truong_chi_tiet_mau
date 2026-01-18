/**
 * Service for calculating results based on formulas
 * Ported from legacy calc-by-formula.service.js
 */
const FormulaService = {
    /**
     * Calculate print result based on actual result and LOD
     * @param {string} actualResult - The entered actual result
     * @param {number|string} lod - Limit of Detection (LOD) value
     * @returns {string} Calculated print result
     */
    calcPrintResult: (actualResult, lod) => {
        // If empty, return empty
        if (!actualResult || actualResult.toString().trim() === '') {
            return '';
        }

        // If no LOD, just return the actual result (fallback)
        if (!lod) {
            return actualResult;
        }

        const resultNum = parseFloat(actualResult);
        const lodNum = parseFloat(lod);

        // Check if numeric
        if (isNaN(resultNum) || isNaN(lodNum)) {
            return actualResult;
        }

        // Logic: If result < LOD, return "KPH (LOD = [LOD])"
        if (resultNum < lodNum) {
            return `KPH\n(LOD = ${lod})`;
        } else {
            return actualResult;
        }
    }
};

export default FormulaService;
