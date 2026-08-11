import mongoose from 'mongoose';
import { PROPERTY_CATEGORY_OPTIONS, ROAD_OPTIONS } from '@/lib/crmOptions';

const PropertySchema = new mongoose.Schema(
  {
    propertyName: { type: String, required: true },
    projectName: { type: String, default: '' },
    societyName: { type: String, default: '' },
    developerName: { type: String, default: '' },
    propertyCategory: { type: String, enum: PROPERTY_CATEGORY_OPTIONS, default: 'Plot' },
    location: { type: String, required: true },
    road: { type: String, enum: ROAD_OPTIONS, required: true },
    squareYard: { type: Number, required: true },
    facing: { type: String, required: true }, // e.g. East, West, North, South
    dimensions: { type: String, default: '' },
    jdaApproved: { type: Boolean, default: false },
    rera: { type: Boolean, default: false },
    societyApproved: { type: Boolean, default: false },
    pricePerSquareYard: { type: Number, default: 0 },
    price: { type: Number, required: true },
    status: { type: String, enum: ['Available', 'Booked', 'Sold'], default: 'Available' },
    description: { type: String, default: '' },
    galleryImages: { type: [String], default: [] },
    googleMapLink: { type: String, default: '' },
    amenities: { type: [String], default: [] },
    nearbyLandmarks: { type: [String], default: [] }
  },
  { timestamps: true }
);

export default mongoose.models.Property || mongoose.model('Property', PropertySchema);
