// src/models/Trip.ts
import { Schema, model, Document } from 'mongoose';

export interface ITrip extends Document {
  title: string;
  description: string;
  priceUSD: number;
  imageUrl: string;
  createdAt: Date;
}

const TripSchema = new Schema<ITrip>({
  title: { type: String, required: true },
  description: { type: String, required: true },
  priceUSD: { type: Number, required: true },
  imageUrl: { type: String, required: true },
  createdAt: { type: Date, default: Date.now }
});

export const Trip = model<ITrip>('Trip', TripSchema);
