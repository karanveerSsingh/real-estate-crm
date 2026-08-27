import mongoose from 'mongoose';
import { PROPERTY_CATEGORY_OPTIONS } from '@/lib/crmOptions';

const PlotSchema = new mongoose.Schema({
  plotNumber: { type: String, required: true },
  propertyType: { type: String, enum: ['Residential', 'Commercial'], default: 'Residential' },
  size: { type: String, required: true }, // e.g. "120 Gaj"
  facing: { type: String, enum: ['North', 'East', 'South', 'West'], required: true },
  roadWidth: { type: String, enum: ['25 ft', '30 ft', '40 ft', '60 ft', '100 ft', '150 ft'], required: true },
  price: { type: Number, required: true },
  status: { type: String, enum: ['Available', 'Hold', 'Sold', 'Pending'], default: 'Available' },
  remarks: { type: String, default: '' }
});

const PropertySchema = new mongoose.Schema(
  {
    // Common fields
    propertyName: { type: String, required: true }, // For Township, this represents Township/Project Name
    location: { type: String, required: true },
    description: { type: String, default: '' },
    galleryImages: { type: [String], default: [] },
    gallery: {
      type: [{
        type: {
          type: String,
          enum: ['image', 'video'],
          required: true
        },
        url: {
          type: String,
          required: true
        },
        thumbnail: {
          type: String
        }
      }],
      default: []
    },
    googleMapLink: { type: String, default: '' },
    amenities: { type: [String], default: [] },
    nearbyLandmarks: { type: [String], default: [] },
    authorities: { type: [String], default: [] }, // Multi-select local authority/approvals (JDA, RERA, Nagar Palika, etc.)

    // Type identifier
    propertyType: { type: String, enum: ['Individual', 'Township'], default: 'Individual' },

    // Individual Property specific fields (optional / default value)
    projectName: { type: String, default: '' },
    societyName: { type: String, default: '' },
    developerName: { type: String, default: '' },
    propertyCategory: { type: String, default: 'Plot' },
    road: { type: String, default: '' },
    squareYard: { type: Number, default: 0 },
    facing: { type: String, default: '' },
    dimensions: { type: String, default: '' },
    jdaApproved: { type: Boolean, default: false },
    rera: { type: Boolean, default: false },
    societyApproved: { type: Boolean, default: false },
    pricePerSquareYard: { type: Number, default: 0 },
    price: { type: Number, default: 0 },
    status: { type: String, enum: ['Available', 'Booked', 'Sold', 'Hold', 'Pending'], default: 'Available' },

    // Township specific fields
    totalLandArea: { type: String, default: '' }, // e.g. "30 Bigha"
    totalPlots: { type: Number, default: 0 },
    plotConfig: { type: String, default: '' }, // Plot/Shop configuration notes
    plots: { type: [PlotSchema], default: [] }
  },
  { timestamps: true }
);

// Clear cached model to ensure schema updates are applied in Next.js dev server hot-reloading
if (mongoose.models && mongoose.models.Property) {
  delete mongoose.models.Property;
}

export default mongoose.models.Property || mongoose.model('Property', PropertySchema);

