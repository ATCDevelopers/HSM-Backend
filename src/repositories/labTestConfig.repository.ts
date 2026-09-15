// import { db } from '../config/db.js';
// import { labTests } from '../drizzle/schema.js';
// import { eq, and, ilike, or, SQL } from 'drizzle-orm';

// export class LabTestRepository {
//    async create(data: Omit<typeof labTests.$inferInsert, 'id' | 'createdAt' | 'updatedAt' | 'isDeleted'>, userId: string) {
//     try {
//       const [result] = await db
//         .insert(labTests)
//         .values({ 
//           ...data, 
//           createdBy: userId, 
//           updatedBy: userId, 
//           isDeleted: false 
//         })
//         .returning();
//       return result;
//     } catch (dbError: any) {
//       // This will output the exact column or constraint name causing the crash
//       console.error("====== RAW POSTGRES ENGINE EXCEPTION ======");
//       console.error("Message:", dbError.message);
//       console.error("Detail:", dbError.detail);
//       console.error("Hint:", dbError.hint);
//       console.error("===========================================");
//       throw dbError;
//     }
//   }

//   async findById(id: string) {
//     const [result] = await db.select().from(labTests).where(and(eq(labTests.id, id), eq(labTests.isDeleted, false)));
//     return result || null;
//   }

//   async searchTests(searchTerms?: string, category?: string) {
//     const conditions: (SQL | undefined)[] = [eq(labTests.isDeleted, false)];
//     if (searchTerms) {
//       conditions.push(or(ilike(labTests.name, `%${searchTerms}%`), ilike(labTests.description, `%${searchTerms}%`)));
//     }
//     if (category) {
//       conditions.push(eq(labTests.category, category));
//     }
//     const validConditions = conditions.filter((c): c is SQL => c !== undefined);
//     return db.select().from(labTests).where(and(...validConditions));
//   }

//   async update(id: string, updates: Partial<Omit<typeof labTests.$inferInsert, 'id' | 'createdBy' | 'createdAt'>>, userId: string) {
//     const [result] = await db.update(labTests).set({ ...updates, updatedBy: userId }).where(and(eq(labTests.id, id), eq(labTests.isDeleted, false))).returning();
//     return result || null;
//   }

//   async softDelete(id: string, userId: string) {
//     const [result] = await db.update(labTests).set({ isDeleted: true, deletedAt: new Date(), deletedBy: userId, updatedBy: userId }).where(and(eq(labTests.id, id), eq(labTests.isDeleted, false))).returning();
//     return result ? { success: true, deletedId: result.id } : { success: false };
//   }
// }

// import { db } from '../config/db.js';
// import { labTests } from '../drizzle/schema.js';
// import { eq, and, ilike, or, SQL } from 'drizzle-orm';

// export class LabTestRepository {
//    async create(data: Omit<typeof labTests.$inferInsert, 'id' | 'createdAt' | 'updatedAt' | 'isDeleted'>, userId: string) {
//     try {
//       // APPEND SOLUTION: Safely parse to object/array if it arrives as a string
//       let processedSchema = data.formSchema;
      
//       if (typeof processedSchema === 'string') {
//         try {
//           processedSchema = JSON.parse(processedSchema);
//         } catch {
//           // Fallback if parsing fails
//         }
//       }

//       const [result] = await db
//         .insert(labTests)
//         .values({ 
//           name: data.name,
//           category: data.category,
//           description: data.description,
//           formSchema: processedSchema as any, // Typecast to bypass strict structural checks
          
//           createdBy: userId, 
//           updatedBy: userId, 
//           isDeleted: false 
//         })
//         .returning();
//       return result;
//     } catch (dbError: any) {
//       console.error("====== RAW POSTGRES ENGINE EXCEPTION ======");
//       console.error("Message:", dbError.message);
//       console.error("Detail:", dbError.detail);
//       console.error("Hint:", dbError.hint);
//       console.error("Code:", dbError.code);
//       console.error("===========================================");
//       throw dbError;
//     }
//   }




  

//   async findById(id: string) {
//     const [result] = await db
//       .select()
//       .from(labTests)
//       .where(and(eq(labTests.id, id), eq(labTests.isDeleted, false)));
//     return result || null;
//   }

//   async searchTests(searchTerms?: string, category?: string) {
//     const conditions: (SQL | undefined)[] = [eq(labTests.isDeleted, false)];
//     if (searchTerms) {
//       conditions.push(or(ilike(labTests.name, `%${searchTerms}%`), ilike(labTests.description, `%${searchTerms}%`)));
//     }
//     if (category) {
//       conditions.push(eq(labTests.category, category));
//     }
//     const validConditions = conditions.filter((c): c is SQL => c !== undefined);
//     return db.select().from(labTests).where(and(...validConditions));
//   }

//   async update(id: string, updates: Partial<Omit<typeof labTests.$inferInsert, 'id' | 'createdBy' | 'createdAt'>>, userId: string) {
//     const [result] = await db
//       .update(labTests)
//       .set({ 
//         ...updates, 
//         updatedBy: userId 
//       })
//       .where(and(eq(labTests.id, id), eq(labTests.isDeleted, false)))
//       .returning();
//     return result || null;
//   }

//   async softDelete(id: string, userId: string) {
//     const [result] = await db
//       .update(labTests)
//       .set({ 
//         isDeleted: true, 
//         deletedAt: new Date(), 
//         deletedBy: userId, 
//         updatedBy: userId 
//       })
//       .where(and(eq(labTests.id, id), eq(labTests.isDeleted, false)))
//       .returning();
//     return result ? { success: true, deletedId: result.id } : { success: false };
//   }
// }





import { db } from '../config/db.js';
import { labTests } from '../drizzle/schema.js';
import { eq, and, ilike, or, SQL } from 'drizzle-orm';

type CreateLabTest = Omit<
  typeof labTests.$inferInsert,
  | 'id'
  | 'createdAt'
  | 'updatedAt'
  | 'deletedAt'
  | 'isDeleted'
  | 'createdBy'
  | 'updatedBy'
  | 'deletedBy'
>;

type UpdateLabTest = Partial<
  Omit<
    typeof labTests.$inferInsert,
    | 'id'
    | 'createdAt'
    | 'updatedAt'
    | 'deletedAt'
    | 'isDeleted'
    | 'createdBy'
    | 'updatedBy'
    | 'deletedBy'
  >
>;

export class LabTestRepository {
  /**
   * Create a lab test
   */
  async create(data: CreateLabTest, userId: string) {
    try {
      let processedSchema: any = data.formSchema;

      // Handle formSchema if it arrives as a JSON string
      if (typeof processedSchema === 'string') {
        try {
          processedSchema = JSON.parse(processedSchema);
        } catch {
          throw new Error('formSchema must contain valid JSON');
        }
      }

      // formSchema is defined as any[] in the Drizzle schema
      if (!Array.isArray(processedSchema)) {
        throw new Error('formSchema must be an array');
      }

      const [result] = await db
        .insert(labTests)
        .values({
          name: data.name,
          category: data.category,
          description: data.description,
          formSchema: processedSchema,

          // Audit fields
          createdBy: userId,
          updatedBy: userId,
          isDeleted: false,
        })
        .returning();

      return result;
    } catch (dbError: any) {
      console.error(
        '====== RAW POSTGRES ENGINE EXCEPTION ======'
      );
      console.error('Message:', dbError.message);
      console.error('Detail:', dbError.detail);
      console.error('Hint:', dbError.hint);
      console.error('Code:', dbError.code);
      console.error(
        '==========================================='
      );

      throw dbError;
    }
  }

  /**
   * Find a lab test by ID
   * Only returns records that are not soft-deleted.
   */
  async findById(id: string) {
    const [result] = await db
      .select()
      .from(labTests)
      .where(
        and(
          eq(labTests.id, id),
          eq(labTests.isDeleted, false)
        )
      );

    return result || null;
  }

  /**
   * Search lab tests by name, description, and category.
   * Only returns records that are not soft-deleted.
   */
  async searchTests(
    searchTerms?: string,
    category?: string
  ) {
    const conditions: (SQL | undefined)[] = [
      eq(labTests.isDeleted, false),
    ];

    if (searchTerms?.trim()) {
      const search = `%${searchTerms.trim()}%`;

      conditions.push(
        or(
          ilike(labTests.name, search),
          ilike(labTests.description, search)
        )
      );
    }

    if (category?.trim()) {
      conditions.push(
        eq(labTests.category, category.trim())
      );
    }

    const validConditions = conditions.filter(
      (condition): condition is SQL =>
        condition !== undefined
    );

    return db
      .select()
      .from(labTests)
      .where(and(...validConditions));
  }

  /**
   * Update a lab test.
   *
   * Audit and soft-delete fields are intentionally
   * excluded from the update payload.
   */
  async update(
    id: string,
    updates: UpdateLabTest,
    userId: string
  ) {
    const [result] = await db
      .update(labTests)
      .set({
        ...updates,
        updatedBy: userId,
      })
      .where(
        and(
          eq(labTests.id, id),
          eq(labTests.isDeleted, false)
        )
      )
      .returning();

    return result || null;
  }

  /**
   * Soft delete a lab test.
   */
  async softDelete(
    id: string,
    userId: string
  ) {
    const [result] = await db
      .update(labTests)
      .set({
        isDeleted: true,
        deletedAt: new Date(),
        deletedBy: userId,
        updatedBy: userId,
      })
      .where(
        and(
          eq(labTests.id, id),
          eq(labTests.isDeleted, false)
        )
      )
      .returning();

    if (!result) {
      return {
        success: false,
      };
    }

    return {
      success: true,
      deletedId: result.id,
    };
  }
}
