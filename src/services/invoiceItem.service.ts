import { invoiceItemRepository } from "../repositories/invoiceItem.repository.js";
import { InvoiceItemsTable } from "../drizzle/schema.js";

export const invoiceItemService = {
  /**
   * Appends a new itemized charge line to an active billing invoice.
   */
  async createInvoiceItem(data: typeof InvoiceItemsTable.$inferInsert) {
    // Financial Safety Guard: Ensure billing item price parameters are not negative
    if (Number(data.price) < 0) {
      throw new Error("Invoice line item pricing parameters cannot be a negative value");
    }

    return invoiceItemRepository.create(data);
  },

  /**
   * Retrieves a single itemized billing row by its unique UUID.
   */
  async getInvoiceItemById(id: string) {
    const item = await invoiceItemRepository.findById(id);
    if (!item) {
      throw new Error(`Invoice line item with ID '${id}' was not found`);
    }
    return item;
  },

  /**
   * Fetches all individual line item rows linked to a single parent invoice container.
   * Highly vital for calculating sub-totals and final checkouts in front-end apps.
   */
  async getItemsByInvoiceId(invoiceId: string) {
    return invoiceItemRepository.findByInvoiceId(invoiceId);
  },

  /**
   * Fetches every individual line item row registered globally in the database.
   */
  async getAllInvoiceItems() {
    return invoiceItemRepository.findAll();
  },

  /**
   * Modifies an existing invoice item row configuration with safety baseline validations.
   */
  async updateInvoiceItem(id: string, data: Partial<typeof InvoiceItemsTable.$inferInsert>) {
    // Validate target record row exists on disk arrays first
    await this.getInvoiceItemById(id);

    // Financial Safety Guard: Enforce non-negative updates on financial structures
    if (data.price !== undefined && Number(data.price) < 0) {
      throw new Error("Updated invoice line item pricing cannot be configured below zero");
    }

    const updated = await invoiceItemRepository.update(id, data);
    if (!updated) {
      throw new Error("Failed to modify target invoice item record configurations");
    }
    return updated;
  },

  /**
   * Permanently clears an itemized line item charge from the system database.
   */
  async deleteInvoiceItem(id: string) {
    await this.getInvoiceItemById(id);
    const deleted = await invoiceItemRepository.delete(id);
    if (!deleted) {
      throw new Error("Failed to erase targeted line item from invoice tracking arrays");
    }
    return deleted;
  }
};
