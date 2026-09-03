import { invoiceRepository } from "../repositories/invoice.repository.js";
export const invoiceService = {
    /**
     * Registers a new billing invoice entry after ensuring numbering uniqueness parameters.
     */
    async createInvoice(data) {
        // Rule 1: Prevent invoice number tracking duplicates
        const checkDuplicate = await invoiceRepository.findByInvoiceNumber(data.invoiceNumber);
        if (checkDuplicate) {
            throw new Error(`Invoice with reference code '${data.invoiceNumber}' is already registered`);
        }
        return invoiceRepository.create(data);
    },
    /**
     * Fetches an invoice with its joined database descriptions.
     */
    async getInvoiceById(id) {
        const invoice = await invoiceRepository.findById(id);
        if (!invoice) {
            throw new Error(`Billing invoice tracking instance with ID '${id}' was not found`);
        }
        return invoice;
    },
    /**
     * Fetches every registered invoice transaction ledger.
     */
    async getAllInvoices() {
        return invoiceRepository.findAll();
    },
    /**
     * Filters ledger tracks strictly targeting a single patient ID index context.
     */
    async getInvoicesByPatient(patientId) {
        return invoiceRepository.findByPatientId(patientId);
    },
    /**
     * Modifies an invoice with safety validation logic parameters.
     */
    async updateInvoice(id, data) {
        const existing = await this.getInvoiceById(id);
        // Rule 2: Prevent invoice reference string collision targets during mutation execution
        if (data.invoiceNumber && data.invoiceNumber !== existing.invoiceNumber) {
            const checkDuplicate = await invoiceRepository.findByInvoiceNumber(data.invoiceNumber);
            if (checkDuplicate) {
                throw new Error(`Reference number code '${data.invoiceNumber}' is already locked by another file`);
            }
        }
        const updated = await invoiceRepository.update(id, data);
        if (!updated)
            throw new Error("Failed to modify invoice tracking logs");
        return updated;
    },
    /**
     * Safe boundary deletion interface execution hook.
     */
    async deleteInvoice(id) {
        await this.getInvoiceById(id);
        const deleted = await invoiceRepository.delete(id);
        if (!deleted)
            throw new Error("Failed to drop target record row from database disk arrays");
        return deleted;
    }
};
