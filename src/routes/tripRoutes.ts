// src/routes/tripRoutes.ts


import { Router } from 'express';
import type { Request, Response } from 'express'; //  Fixed: Explicitly marks them as types




import { Trip } from '../models/Trip.js'; //  Fixed: Added the explicit .js extension


const router = Router();

// 1. POST Endpoint: Lets the operator create a new dynamic tour
router.post('/trips', async (req: Request, res: Response): Promise<void> => {
  try {
    const { title, description, priceUSD, imageUrl } = req.body;
    
    const newTrip = new Trip({ title, description, priceUSD, imageUrl });
    await newTrip.save();
    
    res.status(201).json({ message: "Tour post created live!", data: newTrip });
  } catch (error) {
    res.status(500).json({ message: "Error saving tour", error });
  }
});

// 2. GET Endpoint: Lets tourists see all live vacation postings
router.get('/trips', async (_req: Request, res: Response): Promise<void> => {
  try {
    const trips = await Trip.find().sort({ createdAt: -1 });
    res.status(200).json(trips);
  } catch (error) {
    res.status(500).json({ message: "Error fetching tours", error });
  }
});

export default router;
