'use client';

import React, { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { 
  Building2, 
  Search, 
  Plus, 
  X, 
  Loader2, 
  Compass, 
  MapPin, 
  CheckCircle, 
  Trash2, 
  Edit3, 
  Sparkles,
  Map,
  Users,
  Eye,
  AlertCircle,
  ChevronRight,
  ChevronLeft,
  Play,
  Upload,
  Download,
  Maximize2,
  LandPlot
} from 'lucide-react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import toast from 'react-hot-toast';
import { PROPERTY_CATEGORY_OPTIONS, ROAD_OPTIONS, formatINR } from '@/lib/crmOptions';

const propertySchema = z.object({
  propertyType: z.enum(['Individual', 'Township']).default('Individual'),
  propertyName: z.string().min(1, 'Property name is required'),
  projectName: z.string().optional().default(''),
  societyName: z.string().optional().default(''),
  developerName: z.string().optional().default(''),
  propertyCategory: z.string().default('Plot'),
  location: z.string().min(1, 'Location is required'),
  road: z.string().optional().default(''),
  squareYard: z.number().optional().default(0),
  facing: z.string().optional().default(''),
  dimensions: z.string().optional().default(''),
  jdaApproved: z.boolean().default(false),
  rera: z.boolean().default(false),
  societyApproved: z.boolean().default(false),
  authorities: z.array(z.string()).default([]),
  pricePerSquareYard: z.number().optional().default(0),
  price: z.number().optional().default(0),
  status: z.string().default('Available'),
  description: z.string().optional().default(''),
  googleMapLink: z.string().optional().default(''),
  amenities: z.array(z.string()).default([]),
  nearbyLandmarks: z.array(z.string()).default([]),
  galleryImages: z.array(z.string()).default([]),
  gallery: z.array(z.object({
    type: z.enum(['image', 'video']),
    url: z.string(),
    thumbnail: z.string().optional()
  })).default([]),
  totalLandArea: z.string().optional().default(''),
  totalPlots: z.number().optional().default(0),
  plotConfig: z.string().optional().default(''),
  plots: z.array(z.any()).default([]),
});

type PropertyFormValues = z.infer<typeof propertySchema>;

type GalleryMedia = {
  type: 'image' | 'video';
  url: string;
  thumbnail?: string;
};

const normalizeMediaUrl = (url: string) => {
  if (!url) return url;
  if (url.startsWith('http://') || url.startsWith('https://')) return url;
  return url.startsWith('/') ? url : `/${url}`;
};

const getPropertyMedia = (property: { gallery?: GalleryMedia[]; galleryImages?: string[] }): GalleryMedia[] => {
  if (property.gallery?.length) {
    return property.gallery.map((item) => ({
      ...item,
      url: normalizeMediaUrl(item.url),
    }));
  }

  return (property.galleryImages || []).map((url) => ({ type: 'image', url: normalizeMediaUrl(url) }));
};

export default function InventoryPage() {
  const router = useRouter();
  const [properties, setProperties] = useState<any[]>([]);
  const [matchingLeads, setMatchingLeads] = useState<any[]>([]);
  const [matchingLeadsLoading, setMatchingLeadsLoading] = useState(false);
  const [loading, setLoading] = useState(true);

  // Search & Filter state
  const [searchVal, setSearchVal] = useState('');
  const [filterRoad, setFilterRoad] = useState('');
  const [filterStatus, setFilterStatus] = useState('');
  const [filterJDA, setFilterJDA] = useState('');

  // Selected Property for side drawer detail
  const [selectedProperty, setSelectedProperty] = useState<any | null>(null);
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [uploadingMedia, setUploadingMedia] = useState(false);
  const [unavailableMedia, setUnavailableMedia] = useState<string[]>([]);

  // Modal / Form state
  const [modalOpen, setModalOpen] = useState(false);
  const [editingProperty, setEditingProperty] = useState<any | null>(null);
  
  // Custom list inputs
  const [amenityInput, setAmenityInput] = useState('');
  const [landmarkInput, setLandmarkInput] = useState('');
  const [galleryInput, setGalleryInput] = useState('');
  const mediaInputRef = useRef<HTMLInputElement>(null);
  const mediaPreviewRef = useRef<HTMLDivElement>(null);

  // Plot Form state inside Township drawer
  const [showPlotForm, setShowPlotForm] = useState(false);
  const [editingPlotId, setEditingPlotId] = useState<string | null>(null);
  const [plotFormNumber, setPlotFormNumber] = useState('');
  const [plotFormType, setPlotFormType] = useState<'Residential' | 'Commercial'>('Residential');
  const [plotFormSize, setPlotFormSize] = useState('');
  const [plotFormFacing, setPlotFormFacing] = useState<'North' | 'East' | 'South' | 'West'>('East');
  const [plotFormRoadWidth, setPlotFormRoadWidth] = useState<'25 ft' | '30 ft' | '40 ft' | '60 ft' | '100 ft' | '150 ft'>('30 ft');
  const [plotFormPrice, setPlotFormPrice] = useState<number>(0);
  const [plotFormStatus, setPlotFormStatus] = useState<'Available' | 'Hold' | 'Sold' | 'Pending'>('Available');
  const [plotFormRemarks, setPlotFormRemarks] = useState('');

  // Township drawer filters/search
  const [plotSearchQuery, setPlotSearchQuery] = useState('');
  const [plotFilterType, setPlotFilterType] = useState('');
  const [plotFilterStatus, setPlotFilterStatus] = useState('');

  useEffect(() => {
    setCarouselIndex(0);
    setUnavailableMedia([]);
    if (!selectedProperty?._id) {
      setMatchingLeads([]);
      return;
    }
    let active = true;
    setMatchingLeadsLoading(true);
    fetch(`/api/matches/property/${selectedProperty._id}`)
      .then(async (response) => {
        const data = await response.json();
        if (!response.ok) throw new Error(data.error || 'Unable to match customers');
        return data.matches || [];
      })
      .then((matches) => { if (active) setMatchingLeads(matches); })
      .catch((error) => { if (active) { setMatchingLeads([]); toast.error(error instanceof Error ? error.message : 'Unable to match customers'); } })
      .finally(() => { if (active) setMatchingLeadsLoading(false); });
    return () => { active = false; };
  }, [selectedProperty]);

  useEffect(() => {
    fetchProperties();
  }, []);

  const fetchProperties = async () => {
    try {
      setLoading(true);
      let url = `/api/properties?search=${encodeURIComponent(searchVal)}` +
                `&road=${filterRoad}` +
                `&status=${filterStatus}` +
                `&jda=${filterJDA}`;
      
      const res = await fetch(url);
      if (res.ok) {
        setProperties(await res.json());
      } else {
        toast.error('Failed to fetch property listings');
      }
    } catch (err) {
      toast.error('Error fetching inventory');
    } finally {
      setLoading(false);
    }
  };


  const handleSearchKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') fetchProperties();
  };

  // Form setups
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<PropertyFormValues>({
    resolver: zodResolver(propertySchema) as any,
    defaultValues: {
      propertyType: 'Individual',
      propertyName: '',
      projectName: '',
      societyName: '',
      developerName: '',
      propertyCategory: 'Plot',
      location: '',
      road: 'Tonk Road',
      squareYard: 150,
      facing: 'East',
      dimensions: '',
      jdaApproved: true,
      rera: true,
      societyApproved: false,
      authorities: ['JDA', 'RERA'],
      pricePerSquareYard: 20000,
      price: 3000000,
      status: 'Available',
      description: '',
      googleMapLink: '',
      amenities: [],
      nearbyLandmarks: [],
      galleryImages: [],
      gallery: [],
      totalLandArea: '',
      totalPlots: 0,
      plotConfig: '',
      plots: [],
    }
  });

  const formPropertyType = watch('propertyType') || 'Individual';
  const formAmenities = watch('amenities') || [];
  const formLandmarks = watch('nearbyLandmarks') || [];
  const formGalleryImages = watch('galleryImages') || [];
  const formGallery = watch('gallery') || [];
  const formSquareYard = watch('squareYard') || 0;
  const formRate = watch('pricePerSquareYard') || 0;
  const formAuthorities = watch('authorities') || [];

  useEffect(() => {
    if (formPropertyType === 'Individual' && formSquareYard > 0 && formRate > 0) {
      setValue('price', formSquareYard * formRate, { shouldValidate: true });
    }
  }, [formSquareYard, formRate, setValue, formPropertyType]);

  const handleOpenAddModal = () => {
    setEditingProperty(null);
    reset({
      propertyType: 'Individual',
      propertyName: '',
      projectName: '',
      societyName: '',
      developerName: '',
      propertyCategory: 'Plot',
      location: '',
      road: 'Tonk Road',
      squareYard: 150,
      facing: 'East',
      dimensions: '',
      jdaApproved: true,
      rera: true,
      societyApproved: false,
      authorities: ['JDA', 'RERA'],
      pricePerSquareYard: 20000,
      price: 3000000,
      status: 'Available',
      description: '',
      googleMapLink: '',
      amenities: [],
      nearbyLandmarks: [],
      galleryImages: [],
      gallery: [],
      totalLandArea: '',
      totalPlots: 0,
      plotConfig: '',
      plots: [],
    });
    setModalOpen(true);
  };

  const handleOpenEditModal = (prop: any) => {
    setEditingProperty(prop);
    reset({
      propertyType: prop.propertyType || 'Individual',
      propertyName: prop.propertyName,
      projectName: prop.projectName || '',
      societyName: prop.societyName || '',
      developerName: prop.developerName || '',
      propertyCategory: prop.propertyCategory || 'Plot',
      location: prop.location,
      road: prop.road || '',
      squareYard: prop.squareYard || 0,
      facing: prop.facing || '',
      dimensions: prop.dimensions || '',
      jdaApproved: prop.jdaApproved || false,
      rera: prop.rera || false,
      societyApproved: prop.societyApproved || false,
      authorities: prop.authorities || [
        ...(prop.jdaApproved ? ['JDA'] : []),
        ...(prop.rera ? ['RERA'] : []),
        ...(prop.societyApproved ? ['Registered Society'] : [])
      ],
      pricePerSquareYard: prop.pricePerSquareYard || 0,
      price: prop.price || 0,
      status: prop.status || 'Available',
      description: prop.description || '',
      googleMapLink: prop.googleMapLink || '',
      amenities: prop.amenities || [],
      nearbyLandmarks: prop.nearbyLandmarks || [],
      galleryImages: prop.galleryImages || [],
      gallery: getPropertyMedia(prop),
      totalLandArea: prop.totalLandArea || '',
      totalPlots: prop.totalPlots || 0,
      plotConfig: prop.plotConfig || '',
      plots: prop.plots || [],
    });
    setModalOpen(true);
  };

  const onSubmit = async (data: PropertyFormValues) => {
    try {
      const url = editingProperty ? `/api/properties/${editingProperty._id}` : '/api/properties';
      const method = editingProperty ? 'PUT' : 'POST';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(data)
      });

      if (res.ok) {
        toast.success(editingProperty ? 'Property details updated' : 'Property added successfully');
        setModalOpen(false);
        fetchProperties();
        if (selectedProperty && selectedProperty._id === editingProperty?._id) {
          setSelectedProperty(await res.json());
        }
      } else {
        toast.error('Failed to save property listing');
      }
    } catch (err) {
      toast.error('Error saving property record');
    }
  };

  const handleDeleteProperty = async (propId: string) => {
    if (!confirm('Are you sure you want to delete this property? This is irreversible.')) return;

    try {
      const res = await fetch(`/api/properties/${propId}`, { method: 'DELETE' });
      if (res.ok) {
        toast.success('Property listing deleted');
        fetchProperties();
        if (selectedProperty?._id === propId) setSelectedProperty(null);
      } else {
        toast.error('Failed to delete listing');
      }
    } catch (err) {
      toast.error('Error deleting property');
    }
  };

  const toggleAuthority = (auth: string) => {
    let newAuths = [...formAuthorities];
    if (newAuths.includes(auth)) {
      newAuths = newAuths.filter((item) => item !== auth);
    } else {
      newAuths.push(auth);
    }
    setValue('authorities', newAuths, { shouldDirty: true });
    
    // Backward compatibility flags
    if (auth === 'JDA') setValue('jdaApproved', newAuths.includes('JDA'), { shouldDirty: true });
    if (auth === 'RERA') setValue('rera', newAuths.includes('RERA'), { shouldDirty: true });
    if (auth === 'Registered Society') setValue('societyApproved', newAuths.includes('Registered Society'), { shouldDirty: true });
  };

  const saveTownshipProperty = async (updatedProperty: any) => {
    try {
      const res = await fetch(`/api/properties/${updatedProperty._id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedProperty)
      });
      if (res.ok) {
        const saved = await res.json();
        setSelectedProperty(saved);
        setProperties(prev => prev.map(p => p._id === saved._id ? saved : p));
        toast.success('Township inventory updated');
      } else {
        toast.error('Failed to update township inventory');
      }
    } catch (err) {
      toast.error('Error updating township');
    }
  };

  const handleSavePlot = async () => {
    if (!plotFormNumber.trim()) {
      toast.error('Plot number is required');
      return;
    }
    if (!plotFormSize.trim()) {
      toast.error('Plot size is required');
      return;
    }
    if (plotFormPrice <= 0) {
      toast.error('Price must be greater than 0');
      return;
    }

    let updatedPlots = [...(selectedProperty.plots || [])];

    const plotData = {
      plotNumber: plotFormNumber.trim(),
      propertyType: plotFormType,
      size: plotFormSize.trim(),
      facing: plotFormFacing,
      roadWidth: plotFormRoadWidth,
      price: Number(plotFormPrice),
      status: plotFormStatus,
      remarks: plotFormRemarks.trim()
    };

    if (editingPlotId) {
      updatedPlots = updatedPlots.map(p => 
        (p._id === editingPlotId || p.plotNumber === editingPlotId) ? { ...p, ...plotData } : p
      );
    } else {
      if (updatedPlots.some(p => p.plotNumber === plotData.plotNumber)) {
        toast.error(`Plot number ${plotData.plotNumber} already exists in this township.`);
        return;
      }
      updatedPlots.push(plotData);
    }

    const updatedProperty = { ...selectedProperty, plots: updatedPlots };
    await saveTownshipProperty(updatedProperty);

    setPlotFormNumber('');
    setPlotFormSize('');
    setPlotFormPrice(0);
    setPlotFormRemarks('');
    setEditingPlotId(null);
    setShowPlotForm(false);
  };

  const handleDeletePlot = async (plotId: string, plotNum: string) => {
    if (!confirm(`Are you sure you want to delete Plot ${plotNum}?`)) return;
    const updatedPlots = (selectedProperty.plots || []).filter((p: any) => 
      p._id !== plotId && p.plotNumber !== plotNum
    );
    const updatedProperty = { ...selectedProperty, plots: updatedPlots };
    await saveTownshipProperty(updatedProperty);
  };

  const handleQuickSellPlot = async (plotId: string, plotNum: string) => {
    const updatedPlots = (selectedProperty.plots || []).map((p: any) => 
      (p._id === plotId || p.plotNumber === plotNum) ? { ...p, status: 'Sold' } : p
    );
    const updatedProperty = { ...selectedProperty, plots: updatedPlots };
    await saveTownshipProperty(updatedProperty);
  };

  const handleQuickHoldPlot = async (plotId: string, plotNum: string) => {
    const updatedPlots = (selectedProperty.plots || []).map((p: any) => 
      (p._id === plotId || p.plotNumber === plotNum) ? { ...p, status: 'Hold' } : p
    );
    const updatedProperty = { ...selectedProperty, plots: updatedPlots };
    await saveTownshipProperty(updatedProperty);
  };

  const handleUpdatePlotStatus = async (plotId: string, plotNum: string, newStatus: string) => {
    const updatedPlots = (selectedProperty.plots || []).map((p: any) => 
      (p._id === plotId || p.plotNumber === plotNum) ? { ...p, status: newStatus } : p
    );
    const updatedProperty = { ...selectedProperty, plots: updatedPlots };
    await saveTownshipProperty(updatedProperty);
  };

  const handleTriggerEditPlot = (plot: any) => {
    setEditingPlotId(plot._id || plot.plotNumber);
    setPlotFormNumber(plot.plotNumber);
    setPlotFormType(plot.propertyType);
    setPlotFormSize(plot.size);
    setPlotFormFacing(plot.facing);
    setPlotFormRoadWidth(plot.roadWidth);
    setPlotFormPrice(plot.price);
    setPlotFormStatus(plot.status);
    setPlotFormRemarks(plot.remarks || '');
    setShowPlotForm(true);
  };

  // Tag list helpers
  const addAmenity = () => {
    if (!amenityInput.trim()) return;
    setValue('amenities', [...formAmenities, amenityInput.trim()]);
    setAmenityInput('');
  };

  const removeAmenity = (index: number) => {
    const current = [...formAmenities];
    current.splice(index, 1);
    setValue('amenities', current);
  };

  const addLandmark = () => {
    if (!landmarkInput.trim()) return;
    setValue('nearbyLandmarks', [...formLandmarks, landmarkInput.trim()]);
    setLandmarkInput('');
  };

  const removeLandmark = (index: number) => {
    const current = [...formLandmarks];
    current.splice(index, 1);
    setValue('nearbyLandmarks', current);
  };

  const addGalleryImage = () => {
    if (!galleryInput.trim()) return;
    setValue('galleryImages', [...formGalleryImages, galleryInput.trim()]);
    setValue('gallery', [...formGallery, { type: 'image', url: galleryInput.trim() }]);
    setGalleryInput('');
  };

  const removeGalleryMedia = (index: number) => {
    const current = [...formGallery];
    const [removed] = current.splice(index, 1);
    setValue('gallery', current, { shouldDirty: true });
    if (removed?.type === 'image') {
      setValue('galleryImages', formGalleryImages.filter((url) => url !== removed.url), { shouldDirty: true });
    }
  };

  const handleMediaUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    event.target.value = '';
    if (!files.length) return;

    const supported = /\.(jpe?g|png|webp|mp4|webm|mov)$/i;
    const invalidFile = files.find((file) => !supported.test(file.name));
    if (invalidFile) {
      toast.error(`Unsupported file: ${invalidFile.name}. Use JPG, PNG, WEBP, MP4, WEBM, or MOV.`);
      return;
    }

    setUploadingMedia(true);
    try {
      const uploadData = new FormData();
      files.forEach((file) => uploadData.append('files', file));
      const response = await fetch('/api/properties/upload', { method: 'POST', body: uploadData });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Media upload failed');

      const media = result as GalleryMedia[];
      setValue('gallery', [...formGallery, ...media], { shouldDirty: true });
      setValue(
        'galleryImages',
        [...formGalleryImages, ...media.filter((item) => item.type === 'image').map((item) => item.url)],
        { shouldDirty: true }
      );
      toast.success(`${media.length} media file${media.length === 1 ? '' : 's'} uploaded`);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Unable to upload media');
    } finally {
      setUploadingMedia(false);
    }
  };

  const openMediaFullscreen = async () => {
    const preview = mediaPreviewRef.current;
    if (!preview || document.fullscreenElement) return;
    try {
      await preview.requestFullscreen();
    } catch {
      toast.error('Fullscreen is not available in this browser');
    }
  };

  const markMediaUnavailable = (url: string) => {
    setUnavailableMedia((current) => current.includes(url) ? current : [...current, url]);
  };

  return (
    <div className="space-y-6">
      
      {/* Title */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold flex items-center gap-2">
            Property Inventory management <Building2 className="h-4.5 w-4.5 text-blue-500" />
          </h2>
          <p className="text-xs text-[var(--muted)] mt-0.5">
            Manage real estate plot listings, specifications, and view matching buyers.
          </p>
        </div>
        
        <div>
          <button
            onClick={handleOpenAddModal}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5 cursor-pointer shadow"
          >
            <Plus className="h-4.5 w-4.5" /> Add Property Listing
          </button>
        </div>
      </div>

      {/* SEARCH AND FILTERS */}
      <div className="flex items-center gap-2 flex-wrap">
        <div className="relative flex-1 max-w-xs min-w-[200px]">
          <Search className="absolute left-3 top-2.5 h-4.5 w-4.5 text-[var(--muted)] pointer-events-none" />
          <input
            type="text"
            placeholder="Search property names..."
            value={searchVal}
            onChange={(e) => setSearchVal(e.target.value)}
            onKeyDown={handleSearchKeyDown}
            className="w-full pl-10 pr-4 py-2 border rounded-xl text-xs bg-[var(--card)] border-[var(--border)] text-[var(--foreground)] focus:outline-none"
          />
        </div>

        <select
          value={filterRoad}
          onChange={(e) => setFilterRoad(e.target.value)}
          className="p-2 border rounded-xl text-xs bg-[var(--card)] border-[var(--border)] text-[var(--foreground)] focus:outline-none cursor-pointer"
        >
          <option value="">All Highways</option>
          {ROAD_OPTIONS.map((road) => (
            <option key={road} value={road}>{road}</option>
          ))}
        </select>

        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="p-2 border rounded-xl text-xs bg-[var(--card)] border-[var(--border)] text-[var(--foreground)] focus:outline-none cursor-pointer"
        >
          <option value="">All Statuses</option>
          <option value="Available">Available</option>
          <option value="Booked">Booked</option>
          <option value="Sold">Sold</option>
        </select>

        <select
          value={filterJDA}
          onChange={(e) => setFilterJDA(e.target.value)}
          className="p-2 border rounded-xl text-xs bg-[var(--card)] border-[var(--border)] text-[var(--foreground)] focus:outline-none cursor-pointer"
        >
          <option value="">All Approvals</option>
          <option value="true">JDA Approved</option>
        </select>

        <button
          onClick={fetchProperties}
          className="px-4 py-2 bg-blue-600/10 hover:bg-blue-600/15 text-blue-500 rounded-xl text-xs font-semibold border border-blue-500/20 cursor-pointer"
        >
          Search
        </button>
      </div>

      {/* CORE DISPLAY (GRID SPLIT FOR SIDE DRAWER DETAILS) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        
        {/* Properties Catalog List */}
        <div className={`grid grid-cols-1 sm:grid-cols-2 gap-4 ${
          selectedProperty ? 'lg:col-span-8' : 'lg:col-span-12'
        }`}>
          {loading ? (
            <div className="col-span-full py-20 text-center">
              <Loader2 className="h-8 w-8 animate-spin text-blue-500 mx-auto mb-2" />
              <span className="text-xs text-[var(--muted)]">Cataloging listings...</span>
            </div>
          ) : properties.length === 0 ? (
            <div className="col-span-full py-20 text-center text-xs text-[var(--muted)] bg-[var(--card)] border rounded-xl">
              No properties registered matching criteria.
            </div>
          ) : (
            properties.map((prop) => (
              <div 
                key={prop._id}
                className={`p-4 bg-[var(--card)] border rounded-xl shadow-sm relative overflow-hidden transition-all duration-200 cursor-pointer hover:border-blue-500 ${
                  selectedProperty?._id === prop._id ? 'border-blue-600 ring-1 ring-blue-600/20' : 'border-[var(--border)]'
                }`}
                onClick={() => setSelectedProperty(prop)}
              >
                {/* Header status badge / type */}
                <div className="flex justify-between items-start mb-2">
                  <span className={`text-[9px] px-2 py-0.5 rounded font-bold uppercase ${
                    prop.propertyType === 'Township' ? 'bg-indigo-500/10 text-indigo-500 border border-indigo-500/20' :
                    prop.status === 'Available' ? 'bg-green-500/10 text-green-500' :
                    prop.status === 'Booked' ? 'bg-amber-500/10 text-amber-500' :
                    'bg-slate-500/10 text-[var(--muted)]'
                  }`}>
                    {prop.propertyType === 'Township' ? 'Township / Project' : prop.status}
                  </span>
                  
                  <span className="text-sm font-extrabold text-blue-500">
                    {prop.propertyType === 'Township' 
                      ? (() => {
                          const prices = (prop.plots || []).map((p: any) => p.price).filter((price: any) => typeof price === 'number' && price > 0);
                          if (!prices.length) return 'Price on Request';
                          const min = Math.min(...prices);
                          const max = Math.max(...prices);
                          return min === max ? formatINR(min) : `${formatINR(min)} - ${formatINR(max)}`;
                        })()
                      : formatINR(prop.price)
                    }
                  </span>
                </div>

                <h3 className="text-xs font-bold text-[var(--foreground)] truncate pr-4">
                  {prop.propertyName}
                </h3>
                
                {prop.propertyType === 'Township' ? (
                  <div className="text-[10px] text-[var(--muted)] space-y-1 mt-2.5">
                    <div className="flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-blue-500" /> {prop.location}
                    </div>
                    <div className="flex items-center gap-1">
                      <Compass className="h-3.5 w-3.5 text-amber-500" /> Land Area: {prop.totalLandArea || 'N/A'} | {prop.plots?.length || 0} Plots
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-[var(--muted)] mt-1.5">
                      <LandPlot className="h-3.5 w-3.5 text-green-500" /> Category: {prop.propertyCategory || 'Mixed'}
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="text-[10px] text-[var(--muted)] space-y-1 mt-2.5">
                      <div className="flex items-center gap-1">
                        <MapPin className="h-3.5 w-3.5 text-blue-500" /> {prop.location} ({prop.road})
                      </div>
                      <div className="flex items-center gap-1">
                        <Compass className="h-3.5 w-3.5 text-amber-500" /> {prop.facing} Facing | {prop.squareYard} Sq Yards
                      </div>
                    </div>

                    <div className="flex items-center gap-1 text-[10px] text-[var(--muted)] mt-1.5">
                      <LandPlot className="h-3.5 w-3.5 text-green-500" /> {prop.propertyCategory || 'Plot'} | {prop.dimensions || 'Dimensions pending'} | {formatINR(prop.pricePerSquareYard || 0)} / sq.yd
                    </div>
                  </>
                )}

                {/* Approvals */}
                <div className="flex gap-2 mt-3 pt-2 border-t border-[var(--border)]">
                  {prop.propertyType === 'Township' ? (
                    <>
                      {(prop.authorities || []).map((auth: string) => (
                        <span key={auth} className="text-[9px] font-semibold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
                          {auth}
                        </span>
                      ))}
                      {(!prop.authorities || prop.authorities.length === 0) && (
                        <>
                          {prop.jdaApproved && <span className="text-[9px] font-semibold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">JDA Approved</span>}
                          {prop.rera && <span className="text-[9px] font-semibold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">RERA</span>}
                          {prop.societyApproved && <span className="text-[9px] font-semibold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">Society</span>}
                        </>
                      )}
                      <span className="text-[9px] text-[var(--muted)] ml-auto bg-[var(--background)] px-1.5 py-0.2 rounded">
                        {prop.plots?.filter((p: any) => p.status === 'Available').length || 0} / {prop.plots?.length || 0} Avail
                      </span>
                    </>
                  ) : (
                    <>
                      {prop.jdaApproved && (
                        <span className="text-[9px] font-semibold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20 flex items-center gap-0.5">
                          <CheckCircle className="h-2.5 w-2.5" /> JDA Approved
                        </span>
                      )}
                      {prop.rera && (
                        <span className="text-[9px] font-semibold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
                          RERA
                        </span>
                      )}
                      {prop.societyApproved && (
                        <span className="text-[9px] font-semibold text-emerald-500 bg-emerald-500/10 px-1.5 py-0.2 rounded border border-emerald-500/20">
                          Society
                        </span>
                      )}
                      <span className="text-[9px] text-[var(--muted)] ml-auto bg-[var(--background)] px-1.5 py-0.2 rounded">
                        {prop.amenities?.length || 0} Amenities
                      </span>
                    </>
                  )}
                </div>
              </div>
            ))
          )}
        </div>

        {/* Selected Property Detail Sidebar Drawer */}
        {selectedProperty && (
          <div className="fixed inset-0 z-40 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm lg:static lg:col-span-4 lg:block lg:bg-transparent lg:p-0 lg:backdrop-blur-none">
          <div role="dialog" aria-modal="true" aria-label="Property listing details" className={`w-full ${selectedProperty.propertyType === 'Township' ? 'max-w-3xl' : 'max-w-md'} max-h-[90vh] overflow-y-auto p-4 bg-[var(--card)] border border-[var(--border)] rounded-xl space-y-4 shadow-2xl animate-in fade-in zoom-in-95 duration-200 lg:max-w-none lg:shadow-sm lg:slide-in-from-right-4`}>
            <div className="flex justify-between items-center pb-2 border-b border-[var(--border)]">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[var(--muted)]">Listing Details</h3>
              <button 
                onClick={() => setSelectedProperty(null)}
                className="p-1 rounded hover:bg-[var(--secondary)] cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="space-y-3">
              <div>
                <h4 className="text-sm font-bold">{selectedProperty.propertyName}</h4>
                <p className="text-[11px] text-[var(--muted)] flex items-center gap-0.5 mt-0.5">
                  <MapPin className="h-3 w-3" /> {selectedProperty.location} {selectedProperty.propertyType !== 'Township' && `(${selectedProperty.road})`}
                </p>
                <p className="text-[10px] text-[var(--muted)] mt-1">
                  {selectedProperty.propertyType === 'Township' ? (
                    <>Township / Project | Category: {selectedProperty.propertyCategory || 'Mixed'} | Land Area: {selectedProperty.totalLandArea || 'N/A'}</>
                  ) : (
                    <>{selectedProperty.propertyCategory || 'Plot'} | {formatINR(selectedProperty.pricePerSquareYard || 0)}/sqyd | {selectedProperty.dimensions || 'Dimensions pending'}</>
                  )}
                </p>
                <p className="text-[10px] text-[var(--muted)] mt-0.5">
                  <strong>Authority:</strong> {selectedProperty.authorities?.length ? selectedProperty.authorities.join(' + ') : [selectedProperty.jdaApproved && 'JDA', selectedProperty.rera && 'RERA', selectedProperty.societyApproved && 'Society'].filter(Boolean).join(' + ') || 'N/A'}
                </p>
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => handleOpenEditModal(selectedProperty)}
                  className="flex-1 py-1.5 border border-[var(--border)] rounded-lg text-xs font-semibold hover:bg-[var(--secondary)] cursor-pointer flex items-center justify-center gap-1"
                >
                  <Edit3 className="h-3.5 w-3.5" /> Edit Specs
                </button>
                <button
                  onClick={() => handleDeleteProperty(selectedProperty._id)}
                  className="py-1.5 px-2 bg-red-500/10 hover:bg-red-500/15 border border-red-500/20 text-red-500 rounded-lg text-xs cursor-pointer flex items-center justify-center"
                  title="Delete Listing"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>

              {/* Township Inventory Dashboard */}
              {selectedProperty.propertyType === 'Township' && (() => {
                const plots = selectedProperty.plots || [];
                const total = plots.length;
                const available = plots.filter((p: any) => p.status === 'Available').length;
                const hold = plots.filter((p: any) => p.status === 'Hold').length;
                const sold = plots.filter((p: any) => p.status === 'Sold').length;
                const pending = plots.filter((p: any) => p.status === 'Pending').length;

                const filteredPlots = plots.filter((p: any) => {
                  const matchSearch = plotSearchQuery ? p.plotNumber.toLowerCase().includes(plotSearchQuery.toLowerCase()) : true;
                  const matchType = plotFilterType ? p.propertyType === plotFilterType : true;
                  const matchStatus = plotFilterStatus ? p.status === plotFilterStatus : true;
                  return matchSearch && matchType && matchStatus;
                });

                return (
                  <div className="space-y-3 pt-2 border-t">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] block">Township Plot Dashboard</span>
                    
                    <div className="grid grid-cols-5 gap-1.5 p-2.5 bg-[var(--background)] border border-[var(--border)] rounded-xl text-center">
                      <div>
                        <p className="text-[8px] font-bold text-[var(--muted)] uppercase">Total</p>
                        <p className="text-xs font-bold mt-0.5">{total}</p>
                      </div>
                      <div>
                        <p className="text-[8px] font-bold text-green-500 uppercase">Available</p>
                        <p className="text-xs font-bold text-green-500 mt-0.5">{available}</p>
                      </div>
                      <div>
                        <p className="text-[8px] font-bold text-amber-500 uppercase">Hold</p>
                        <p className="text-xs font-bold text-amber-500 mt-0.5">{hold}</p>
                      </div>
                      <div>
                        <p className="text-[8px] font-bold text-red-500 uppercase">Sold</p>
                        <p className="text-xs font-bold text-red-500 mt-0.5">{sold}</p>
                      </div>
                      <div>
                        <p className="text-[8px] font-bold text-blue-500 uppercase">Pending</p>
                        <p className="text-xs font-bold text-blue-500 mt-0.5">{pending}</p>
                      </div>
                    </div>

                    {/* Plots Section Title & Add Trigger */}
                    <div className="flex justify-between items-center mt-4">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">Plots & Shops Inventory ({filteredPlots.length})</span>
                      <button
                        onClick={() => {
                          setEditingPlotId(null);
                          setPlotFormNumber('');
                          setPlotFormSize('');
                          setPlotFormPrice(0);
                          setPlotFormRemarks('');
                          setShowPlotForm(!showPlotForm);
                        }}
                        className="px-2 py-0.5 bg-blue-600 hover:bg-blue-500 text-white rounded text-[9px] font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <Plus className="h-2.5 w-2.5" /> {showPlotForm && !editingPlotId ? 'Cancel' : 'Add Plot'}
                      </button>
                    </div>

                    {/* Plot Add/Edit Inline Form */}
                    {showPlotForm && (
                      <div className="p-3 bg-[var(--background)] border border-[var(--border)] rounded-xl space-y-3">
                        <p className="text-[10px] font-bold text-blue-500">{editingPlotId ? 'Edit Plot Specs' : 'Add New Plot to Township'}</p>
                        <div className="grid grid-cols-2 gap-2">
                          <div className="space-y-0.5">
                            <label className="text-[8px] font-bold text-[var(--muted)] uppercase">Plot Number</label>
                            <input
                              type="text"
                              value={plotFormNumber}
                              onChange={(e) => setPlotFormNumber(e.target.value)}
                              placeholder="e.g. 01"
                              className="w-full p-1.5 border rounded-lg text-[10px] bg-[var(--card)] border-[var(--border)] focus:outline-none"
                            />
                          </div>

                          <div className="space-y-0.5">
                            <label className="text-[8px] font-bold text-[var(--muted)] uppercase">Property Type</label>
                            <select
                              value={plotFormType}
                              onChange={(e) => setPlotFormType(e.target.value as any)}
                              className="w-full p-1.5 border rounded-lg text-[10px] bg-[var(--card)] border-[var(--border)] focus:outline-none"
                            >
                              <option value="Residential">Residential</option>
                              <option value="Commercial">Commercial</option>
                            </select>
                          </div>

                          <div className="space-y-0.5">
                            <label className="text-[8px] font-bold text-[var(--muted)] uppercase">Size (Gaj / Sqyd)</label>
                            <input
                              type="text"
                              value={plotFormSize}
                              onChange={(e) => setPlotFormSize(e.target.value)}
                              placeholder="e.g. 120 Gaj"
                              className="w-full p-1.5 border rounded-lg text-[10px] bg-[var(--card)] border-[var(--border)] focus:outline-none"
                            />
                          </div>

                          <div className="space-y-0.5">
                            <label className="text-[8px] font-bold text-[var(--muted)] uppercase">Facing</label>
                            <select
                              value={plotFormFacing}
                              onChange={(e) => setPlotFormFacing(e.target.value as any)}
                              className="w-full p-1.5 border rounded-lg text-[10px] bg-[var(--card)] border-[var(--border)] focus:outline-none"
                            >
                              <option value="North">North</option>
                              <option value="East">East</option>
                              <option value="South">South</option>
                              <option value="West">West</option>
                            </select>
                          </div>

                          <div className="space-y-0.5">
                            <label className="text-[8px] font-bold text-[var(--muted)] uppercase">Road Width</label>
                            <select
                              value={plotFormRoadWidth}
                              onChange={(e) => setPlotFormRoadWidth(e.target.value as any)}
                              className="w-full p-1.5 border rounded-lg text-[10px] bg-[var(--card)] border-[var(--border)] focus:outline-none"
                            >
                              <option value="25 ft">25 ft</option>
                              <option value="30 ft">30 ft</option>
                              <option value="40 ft">40 ft</option>
                              <option value="60 ft">60 ft</option>
                              <option value="100 ft">100 ft</option>
                              <option value="150 ft">150 ft</option>
                            </select>
                          </div>

                          <div className="space-y-0.5">
                            <label className="text-[8px] font-bold text-[var(--muted)] uppercase">Price (₹ Amount)</label>
                            <input
                              type="number"
                              value={plotFormPrice || ''}
                              onChange={(e) => setPlotFormPrice(Number(e.target.value))}
                              placeholder="e.g. 2500000"
                              className="w-full p-1.5 border rounded-lg text-[10px] bg-[var(--card)] border-[var(--border)] focus:outline-none"
                            />
                          </div>

                          <div className="space-y-0.5">
                            <label className="text-[8px] font-bold text-[var(--muted)] uppercase">Status</label>
                            <select
                              value={plotFormStatus}
                              onChange={(e) => setPlotFormStatus(e.target.value as any)}
                              className="w-full p-1.5 border rounded-lg text-[10px] bg-[var(--card)] border-[var(--border)] focus:outline-none"
                            >
                              <option value="Available">Available</option>
                              <option value="Hold">Hold</option>
                              <option value="Sold">Sold</option>
                              <option value="Pending">Pending</option>
                            </select>
                          </div>

                          <div className="space-y-0.5">
                            <label className="text-[8px] font-bold text-[var(--muted)] uppercase">Remarks</label>
                            <input
                              type="text"
                              value={plotFormRemarks}
                              onChange={(e) => setPlotFormRemarks(e.target.value)}
                              placeholder="e.g. Corner plot"
                              className="w-full p-1.5 border rounded-lg text-[10px] bg-[var(--card)] border-[var(--border)] focus:outline-none"
                            />
                          </div>
                        </div>

                        <div className="flex justify-end gap-1.5">
                          <button
                            type="button"
                            onClick={() => {
                              setShowPlotForm(false);
                              setEditingPlotId(null);
                            }}
                            className="px-2.5 py-1 border border-[var(--border)] rounded text-[9px] font-semibold hover:bg-[var(--secondary)] cursor-pointer"
                          >
                            Cancel
                          </button>
                          <button
                            type="button"
                            onClick={handleSavePlot}
                            className="px-2.5 py-1 bg-blue-600 text-white rounded text-[9px] font-semibold hover:bg-blue-500 cursor-pointer"
                          >
                            Save Plot
                          </button>
                        </div>
                      </div>
                    )}

                    {/* Plots Search & Filters */}
                    <div className="flex gap-2 items-center flex-wrap">
                      <div className="relative flex-1 min-w-[120px]">
                        <Search className="absolute left-2.5 top-2 h-3.5 w-3.5 text-[var(--muted)]" />
                        <input
                          type="text"
                          placeholder="Search Plot No..."
                          value={plotSearchQuery}
                          onChange={(e) => setPlotSearchQuery(e.target.value)}
                          className="w-full pl-7 pr-2 py-1.5 border rounded-lg text-[10px] bg-[var(--background)] border-[var(--border)] focus:outline-none"
                        />
                      </div>
                      <select
                        value={plotFilterType}
                        onChange={(e) => setPlotFilterType(e.target.value)}
                        className="p-1.5 border rounded-lg text-[10px] bg-[var(--background)] border-[var(--border)] focus:outline-none cursor-pointer"
                      >
                        <option value="">All Types</option>
                        <option value="Residential">Residential</option>
                        <option value="Commercial">Commercial</option>
                      </select>
                      <select
                        value={plotFilterStatus}
                        onChange={(e) => setPlotFilterStatus(e.target.value)}
                        className="p-1.5 border rounded-lg text-[10px] bg-[var(--background)] border-[var(--border)] focus:outline-none cursor-pointer"
                      >
                        <option value="">All Statuses</option>
                        <option value="Available">Available</option>
                        <option value="Hold">Hold</option>
                        <option value="Sold">Sold</option>
                        <option value="Pending">Pending</option>
                      </select>
                    </div>

                    {/* Plots Inventory Table */}
                    <div className="overflow-x-auto border border-[var(--border)] rounded-xl bg-[var(--background)] max-h-[350px] overflow-y-auto">
                      <table className="w-full text-left border-collapse text-[10px]">
                        <thead>
                          <tr className="border-b bg-[var(--secondary)] font-bold text-[var(--muted)] sticky top-0">
                            <th className="p-2">Plot No.</th>
                            <th className="p-2">Type</th>
                            <th className="p-2">Size</th>
                            <th className="p-2">Facing</th>
                            <th className="p-2">Road</th>
                            <th className="p-2">Price</th>
                            <th className="p-2">Status</th>
                            <th className="p-2 text-right">Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredPlots.length === 0 ? (
                            <tr>
                              <td colSpan={8} className="p-4 text-center text-[var(--muted)] italic">No plots registered inside this township</td>
                            </tr>
                          ) : (
                            filteredPlots.map((plot: any) => (
                              <tr key={plot._id || plot.plotNumber} className="border-b hover:bg-[var(--secondary)]/40 transition-colors">
                                <td className="p-2 font-bold">{plot.plotNumber}</td>
                                <td className="p-2 text-[9px]">{plot.propertyType}</td>
                                <td className="p-2">{plot.size}</td>
                                <td className="p-2">{plot.facing}</td>
                                <td className="p-2">{plot.roadWidth}</td>
                                <td className="p-2 font-bold text-blue-500">{formatINR(plot.price)}</td>
                                <td className="p-2">
                                  <select
                                    value={plot.status}
                                    onChange={(e) => handleUpdatePlotStatus(plot._id, plot.plotNumber, e.target.value)}
                                    className={`p-0.5 rounded text-[9px] font-bold ${
                                      plot.status === 'Available' ? 'bg-green-500/10 text-green-500' :
                                      plot.status === 'Hold' ? 'bg-amber-500/10 text-amber-500' :
                                      plot.status === 'Sold' ? 'bg-red-500/10 text-red-500' :
                                      'bg-blue-500/10 text-blue-500'
                                    } border-none focus:outline-none cursor-pointer`}
                                  >
                                    <option value="Available">Available</option>
                                    <option value="Hold">Hold</option>
                                    <option value="Sold">Sold</option>
                                    <option value="Pending">Pending</option>
                                  </select>
                                </td>
                                <td className="p-2 text-right space-x-1">
                                  <button
                                    onClick={() => handleTriggerEditPlot(plot)}
                                    className="p-1 hover:text-blue-500 inline-block cursor-pointer"
                                    title="Edit Plot"
                                  >
                                    <Edit3 className="h-3 w-3" />
                                  </button>
                                  <button
                                    onClick={() => handleDeletePlot(plot._id, plot.plotNumber)}
                                    className="p-1 hover:text-red-500 inline-block cursor-pointer"
                                    title="Delete Plot"
                                  >
                                    <Trash2 className="h-3 w-3" />
                                  </button>
                                </td>
                              </tr>
                            ))
                          )}
                        </tbody>
                      </table>
                    </div>
                  </div>
                );
              })()}

              {getPropertyMedia(selectedProperty).length > 0 && (() => {
                const media = getPropertyMedia(selectedProperty);
                const currentMedia = media[carouselIndex] || media[0];
                const isUnavailable = unavailableMedia.includes(currentMedia.url);
                const moveCarousel = (direction: number) => {
                  setCarouselIndex((current) => (current + direction + media.length) % media.length);
                };

                return (
                  <section className="space-y-2" aria-label="Property media">
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">Property Media</span>
                      <span className="text-[10px] text-[var(--muted)]">{carouselIndex + 1} / {media.length}</span>
                    </div>
                    <div ref={mediaPreviewRef} className="relative aspect-[16/10] overflow-hidden rounded-xl border border-[var(--border)] bg-black">
                      {isUnavailable ? (
                        <div className="flex h-full w-full flex-col items-center justify-center gap-2 bg-[var(--background)] px-4 text-center text-[var(--muted)]">
                          <AlertCircle className="h-6 w-6 text-amber-500" />
                          <span className="text-xs font-semibold">Media unavailable</span>
                          <span className="text-[10px]">This file is no longer accessible. Upload it again to restore it.</span>
                        </div>
                      ) : currentMedia.type === 'video' ? (
                        <video key={currentMedia.url} src={currentMedia.url} controls playsInline preload="metadata" onError={() => markMediaUnavailable(currentMedia.url)} className="h-full w-full object-contain" />
                      ) : (
                        <img src={currentMedia.url} alt={`${selectedProperty.propertyName} media ${carouselIndex + 1}`} onError={() => markMediaUnavailable(currentMedia.url)} className="h-full w-full object-contain" />
                      )}
                      {currentMedia.type === 'video' && (
                        <div className="pointer-events-none absolute left-2 top-2 rounded-md bg-black/60 px-1.5 py-1 text-white">
                          <Play className="h-3 w-3 fill-current" />
                        </div>
                      )}
                      {media.length > 1 && <>
                        <button type="button" aria-label="Previous media" onClick={() => moveCarousel(-1)} className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-black/55 p-1.5 text-white transition-colors hover:bg-black/80 cursor-pointer">
                          <ChevronLeft className="h-4 w-4" />
                        </button>
                        <button type="button" aria-label="Next media" onClick={() => moveCarousel(1)} className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-black/55 p-1.5 text-white transition-colors hover:bg-black/80 cursor-pointer">
                          <ChevronRight className="h-4 w-4" />
                        </button>
                      </>}
                      <div className="absolute right-2 top-2 flex gap-1.5">
                        <a href={currentMedia.url} download target="_blank" rel="noopener noreferrer" aria-label="Download media" className="rounded-full bg-black/55 p-1.5 text-white transition-colors hover:bg-black/80 cursor-pointer">
                          <Download className="h-3.5 w-3.5" />
                        </a>
                        <button type="button" aria-label="View media fullscreen" onClick={openMediaFullscreen} className="rounded-full bg-black/55 p-1.5 text-white transition-colors hover:bg-black/80 cursor-pointer">
                          <Maximize2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </div>
                    {media.length > 1 && (
                      <div className="flex justify-center gap-1.5" aria-label="Media slide navigation">
                        {media.map((item, index) => (
                          <button key={`${item.url}-${index}`} type="button" aria-label={`Show media ${index + 1}`} onClick={() => setCarouselIndex(index)} className={`h-1.5 rounded-full transition-all cursor-pointer ${index === carouselIndex ? 'w-4 bg-blue-500' : 'w-1.5 bg-[var(--border)] hover:bg-blue-400'}`} />
                        ))}
                      </div>
                    )}
                  </section>
                );
              })()}

              {/* Description */}
              {selectedProperty.description && (
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">Description</span>
                  <p className="text-xs text-[var(--muted)] leading-relaxed bg-[var(--background)] p-2.5 rounded-xl border">
                    {selectedProperty.description}
                  </p>
                </div>
              )}

              {/* Map Link */}
              {selectedProperty.googleMapLink && (
                <a
                  href={selectedProperty.googleMapLink}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-3 py-1.5 bg-blue-600/10 hover:bg-blue-600/15 border border-blue-500/20 text-blue-500 rounded-lg text-[10px] font-semibold flex items-center justify-center gap-1.5 cursor-pointer w-full transition-colors"
                >
                  <Map className="h-3.5 w-3.5 text-blue-500" /> Redirect to Google Maps
                </a>
              )}

              {/* Amenities */}
              {selectedProperty.amenities && selectedProperty.amenities.length > 0 && (
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">Amenities</span>
                  <div className="flex gap-1 flex-wrap">
                    {selectedProperty.amenities.map((am: string) => (
                      <span key={am} className="text-[9px] bg-slate-500/10 text-[var(--muted)] px-1.5 py-0.5 rounded font-semibold">
                        {am}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Landmarks */}
              {selectedProperty.nearbyLandmarks && selectedProperty.nearbyLandmarks.length > 0 && (
                <div className="space-y-1">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)]">Nearby Landmarks</span>
                  <div className="flex gap-1 flex-wrap">
                    {selectedProperty.nearbyLandmarks.map((lm: string) => (
                      <span key={lm} className="text-[9px] bg-indigo-500/10 text-indigo-500 px-1.5 py-0.5 rounded font-semibold border border-indigo-500/15">
                        {lm}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Matching Customers */}
              <div className="space-y-2 pt-3 border-t">
                <span className="text-[10px] font-bold uppercase tracking-wider text-[var(--muted)] flex items-center gap-1">
                  <Users className="h-3.5 w-3.5 text-blue-500" /> Reverse Matching Leads ({matchingLeads.length})
                </span>

                <div className="space-y-1.5 max-h-[180px] overflow-y-auto pr-1">
                  {matchingLeadsLoading ? (
                    <div className="flex justify-center p-5"><Loader2 className="h-4 w-4 animate-spin text-blue-500" /></div>
                  ) : matchingLeads.length === 0 ? (
                    <div className="text-[10px] text-[var(--muted)] italic p-2 bg-[var(--background)] rounded-xl border text-center">
                      No matching customers found for this property.
                    </div>
                  ) : (
                    matchingLeads.map((lead) => (
                      <div 
                        key={lead._id}
                        onClick={() => router.push(`/dashboard/leads/${lead._id}`)}
                        className="p-2 bg-[var(--background)] hover:bg-[var(--secondary)] border rounded-lg flex items-center justify-between cursor-pointer transition-colors text-[10px]"
                      >
                        <div>
                          <p className="font-semibold">{lead.fullName}</p>
                          <p className="text-[9px] text-[var(--muted)]">{lead.mobileNumber} · {lead.purpose} · {lead.budget}</p>
                          <p className="text-[9px] text-[var(--muted)]">{lead.preferredLocations?.join(', ')} · {lead.leadStatus}</p>
                        </div>
                        <span className="text-[9px] text-blue-500 font-semibold text-right">Match: {lead.matchScore}%<span className="flex items-center">Profile <ChevronRight className="h-3 w-3" /></span></span>
                      </div>
                    ))
                  )}
                </div>
              </div>

            </div>
          </div>
          </div>
        )}

      </div>

      {/* 5. ADD / EDIT PROPERTY MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" />
          
          <div className="relative w-full max-w-xl bg-[var(--card)] border border-[var(--border)] rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col animate-in fade-in zoom-in-95 duration-200">
            <div className="p-4 border-b border-[var(--border)] flex justify-between items-center bg-[var(--background)]">
              <h3 className="text-md font-bold">
                {editingProperty ? 'Update Listing Specifications' : 'New Property Listing'}
              </h3>
              <button 
                onClick={() => setModalOpen(false)}
                className="p-1 rounded-lg border border-[var(--border)] hover:bg-[var(--secondary)] cursor-pointer"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit(onSubmit)} className="flex-1 overflow-y-auto p-6 space-y-4">
              
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                
                {/* Property Type Selection */}
                <div className="space-y-1 sm:col-span-2">
                  <label className="text-xs font-semibold text-[var(--muted)] uppercase">Listing Type</label>
                  <select
                    {...register('propertyType')}
                    className="w-full p-2 border rounded-xl text-xs bg-[var(--background)] border-[var(--border)] focus:outline-none cursor-pointer"
                  >
                    <option value="Individual">Individual Property</option>
                    <option value="Township">Township / Project</option>
                  </select>
                </div>

                {formPropertyType === 'Township' ? (
                  // Township fields
                  <>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-[var(--muted)] uppercase">Township / Project Name</label>
                      <input
                        {...register('propertyName')}
                        type="text"
                        placeholder="e.g. Apex Greens Phase II"
                        className="w-full p-2 border rounded-xl text-xs bg-[var(--background)] border-[var(--border)] focus:outline-none"
                      />
                      {errors.propertyName && <p className="text-red-400 text-[10px]">{errors.propertyName.message}</p>}
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-[var(--muted)] uppercase">Developer / Builder</label>
                      <input
                        {...register('developerName')}
                        type="text"
                        placeholder="Apex Developers"
                        className="w-full p-2 border rounded-xl text-xs bg-[var(--background)] border-[var(--border)] focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-[var(--muted)] uppercase">Property Category</label>
                      <select
                        {...register('propertyCategory')}
                        className="w-full p-2 border rounded-xl text-xs bg-[var(--background)] border-[var(--border)] focus:outline-none cursor-pointer"
                      >
                        <option value="Residential">Residential</option>
                        <option value="Commercial">Commercial</option>
                        <option value="Mixed">Mixed</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-[var(--muted)] uppercase">Total Land Area</label>
                      <input
                        {...register('totalLandArea')}
                        type="text"
                        placeholder="e.g. 30 Bigha"
                        className="w-full p-2 border rounded-xl text-xs bg-[var(--background)] border-[var(--border)] focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-[var(--muted)] uppercase">Location</label>
                      <input
                        {...register('location')}
                        type="text"
                        placeholder="Sector 3, Tonk Road"
                        className="w-full p-2 border rounded-xl text-xs bg-[var(--background)] border-[var(--border)] focus:outline-none"
                      />
                      {errors.location && <p className="text-red-400 text-[10px]">{errors.location.message}</p>}
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-[var(--muted)] uppercase">Total Number of Plots</label>
                      <input
                        {...register('totalPlots', { valueAsNumber: true })}
                        type="number"
                        placeholder="150"
                        className="w-full p-2 border rounded-xl text-xs bg-[var(--background)] border-[var(--border)] focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1 sm:col-span-2">
                      <label className="text-xs font-semibold text-[var(--muted)] uppercase">Plot / Shop Configuration</label>
                      <input
                        {...register('plotConfig')}
                        type="text"
                        placeholder="e.g. 100 Plots, 50 Shops"
                        className="w-full p-2 border rounded-xl text-xs bg-[var(--background)] border-[var(--border)] focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1 sm:col-span-2">
                      <label className="text-xs font-semibold text-[var(--muted)] uppercase">Google Map Link</label>
                      <input
                        {...register('googleMapLink')}
                        type="text"
                        placeholder="https://maps.google.com/..."
                        className="w-full p-2 border rounded-xl text-xs bg-[var(--background)] border-[var(--border)] focus:outline-none"
                      />
                    </div>
                  </>
                ) : (
                  // Individual fields
                  <>
                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-[var(--muted)] uppercase">Property Name</label>
                      <input
                        {...register('propertyName')}
                        type="text"
                        placeholder="Apex Greens Phase II"
                        className="w-full p-2 border rounded-xl text-xs bg-[var(--background)] border-[var(--border)] focus:outline-none"
                      />
                      {errors.propertyName && <p className="text-red-400 text-[10px]">{errors.propertyName.message}</p>}
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-[var(--muted)] uppercase">Developer / Builder</label>
                      <input
                        {...register('developerName')}
                        type="text"
                        placeholder="Apex Developers"
                        className="w-full p-2 border rounded-xl text-xs bg-[var(--background)] border-[var(--border)] focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-[var(--muted)] uppercase">Property Category</label>
                      <select
                        {...register('propertyCategory')}
                        className="w-full p-2 border rounded-xl text-xs bg-[var(--background)] border-[var(--border)] focus:outline-none cursor-pointer"
                      >
                        {PROPERTY_CATEGORY_OPTIONS.map((category) => (
                          <option key={category} value={category}>{category}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-[var(--muted)] uppercase">Location</label>
                      <input
                        {...register('location')}
                        type="text"
                        placeholder="Sector 3, Tonk Road"
                        className="w-full p-2 border rounded-xl text-xs bg-[var(--background)] border-[var(--border)] focus:outline-none"
                      />
                      {errors.location && <p className="text-red-400 text-[10px]">{errors.location.message}</p>}
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-[var(--muted)] uppercase">Road / Highway</label>
                      <select
                        {...register('road')}
                        className="w-full p-2 border rounded-xl text-xs bg-[var(--background)] border-[var(--border)] focus:outline-none cursor-pointer"
                      >
                        {ROAD_OPTIONS.map((road) => (
                          <option key={road} value={road}>{road}</option>
                        ))}
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-[var(--muted)] uppercase">Square Yards</label>
                      <input
                        {...register('squareYard', { valueAsNumber: true })}
                        type="number"
                        className="w-full p-2 border rounded-xl text-xs bg-[var(--background)] border-[var(--border)] focus:outline-none"
                      />
                      {errors.squareYard && <p className="text-red-400 text-[10px]">{errors.squareYard.message}</p>}
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-[var(--muted)] uppercase">Facing Direction</label>
                      <input
                        {...register('facing')}
                        type="text"
                        placeholder="East, West, Corner, etc."
                        className="w-full p-2 border rounded-xl text-xs bg-[var(--background)] border-[var(--border)] focus:outline-none"
                      />
                      {errors.facing && <p className="text-red-400 text-[10px]">{errors.facing.message}</p>}
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-[var(--muted)] uppercase">Dimensions</label>
                      <input
                        {...register('dimensions')}
                        type="text"
                        placeholder="30 x 45"
                        className="w-full p-2 border rounded-xl text-xs bg-[var(--background)] border-[var(--border)] focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-[var(--muted)] uppercase">Price Per Sq Yard</label>
                      <input
                        {...register('pricePerSquareYard', { valueAsNumber: true })}
                        type="number"
                        className="w-full p-2 border rounded-xl text-xs bg-[var(--background)] border-[var(--border)] focus:outline-none"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-[var(--muted)] uppercase">Total Demand Amount</label>
                      <input
                        {...register('price', { valueAsNumber: true })}
                        type="number"
                        className="w-full p-2 border rounded-xl text-xs bg-[var(--background)] border-[var(--border)] focus:outline-none"
                      />
                      {errors.price && <p className="text-red-400 text-[10px]">{errors.price.message}</p>}
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-[var(--muted)] uppercase">Status</label>
                      <select
                        {...register('status')}
                        className="w-full p-2 border rounded-xl text-xs bg-[var(--background)] border-[var(--border)] focus:outline-none cursor-pointer"
                      >
                        <option value="Available">Available</option>
                        <option value="Booked">Booked</option>
                        <option value="Sold">Sold</option>
                      </select>
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs font-semibold text-[var(--muted)] uppercase">Google Map Link</label>
                      <input
                        {...register('googleMapLink')}
                        type="text"
                        placeholder="https://maps.google.com/..."
                        className="w-full p-2 border rounded-xl text-xs bg-[var(--background)] border-[var(--border)] focus:outline-none"
                      />
                    </div>
                  </>
                )}

              </div>

              {/* Local Authority / Approval Details multi-selection */}
              <div className="space-y-1.5 p-3 bg-[var(--background)] border border-[var(--border)] rounded-xl">
                <label className="text-xs font-semibold text-[var(--muted)] uppercase block">Local Authority / Approval</label>
                <div className="flex gap-4 flex-wrap">
                  {['JDA', 'RERA', 'Registered Society', 'Nagar Palika', 'Other'].map((auth) => (
                    <label key={auth} className="flex items-center gap-2 text-xs font-semibold cursor-pointer">
                      <input
                        type="checkbox"
                        checked={formAuthorities.includes(auth)}
                        onChange={() => toggleAuthority(auth)}
                        className="rounded border-[var(--border)] text-blue-600 focus:ring-blue-500"
                      />
                      {auth}
                    </label>
                  ))}
                </div>
              </div>

              {/* Standard Amenities Selection for Township */}
              {formPropertyType === 'Township' && (
                <div className="space-y-1.5 p-3 bg-[var(--background)] border border-[var(--border)] rounded-xl">
                  <label className="text-xs font-semibold text-[var(--muted)] uppercase block">Standard Amenities</label>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {[
                      'Club House',
                      'Swimming Pool',
                      'Temple',
                      'Park',
                      'Kids Play Area',
                      'Gym',
                      'Community Hall',
                      'Security',
                      'CCTV',
                      'Commercial Area',
                      'Parking',
                      'Internal Roads'
                    ].map((amenity) => {
                      const isSelected = formAmenities.includes(amenity);
                      return (
                        <label key={amenity} className="flex items-center gap-2 text-xs cursor-pointer">
                          <input
                            type="checkbox"
                            checked={isSelected}
                            onChange={() => {
                              if (isSelected) {
                                setValue('amenities', formAmenities.filter(a => a !== amenity), { shouldDirty: true });
                              } else {
                                setValue('amenities', [...formAmenities, amenity], { shouldDirty: true });
                              }
                            }}
                            className="rounded border-[var(--border)] text-blue-600 focus:ring-blue-500"
                          />
                          {amenity}
                        </label>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* Add Custom / Other Amenities */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--muted)] uppercase block">Add Custom Amenities</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={amenityInput}
                    onChange={(e) => setAmenityInput(e.target.value)}
                    placeholder="Water Pipeline, Park, etc."
                    className="flex-1 p-2 border rounded-xl text-xs bg-[var(--background)] border-[var(--border)] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={addAmenity}
                    className="px-3.5 py-1 bg-blue-600 text-white rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    Add
                  </button>
                </div>
                <div className="flex gap-1 flex-wrap">
                  {formAmenities.map((am, idx) => (
                    <span key={idx} className="text-[10px] bg-slate-500/10 text-[var(--muted)] px-2 py-0.5 rounded-full flex items-center gap-1 font-semibold border">
                      {am} <X className="h-3 w-3 hover:text-red-500 cursor-pointer" onClick={() => removeAmenity(idx)} />
                    </span>
                  ))}
                </div>
              </div>

              {/* Landmarks Input */}
              <div className="space-y-1.5">
                <label className="text-xs font-semibold text-[var(--muted)] uppercase block">Nearby Landmarks</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={landmarkInput}
                    onChange={(e) => setLandmarkInput(e.target.value)}
                    placeholder="Metro Station, Hospital, etc."
                    className="flex-1 p-2 border rounded-xl text-xs bg-[var(--background)] border-[var(--border)] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={addLandmark}
                    className="px-3.5 py-1 bg-blue-600 text-white rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    Add
                  </button>
                </div>
                <div className="flex gap-1 flex-wrap">
                  {formLandmarks.map((lm, idx) => (
                    <span key={idx} className="text-[10px] bg-indigo-500/10 text-indigo-500 px-2 py-0.5 rounded-full flex items-center gap-1 font-semibold border border-indigo-500/15">
                      {lm} <X className="h-3 w-3 hover:text-red-500 cursor-pointer" onClick={() => removeLandmark(idx)} />
                    </span>
                  ))}
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <label className="text-xs font-semibold text-[var(--muted)] uppercase block">Gallery / Property Media</label>
                  <input ref={mediaInputRef} type="file" accept="image/jpeg,image/png,image/webp,video/mp4,video/webm,video/quicktime" multiple className="hidden" onChange={handleMediaUpload} />
                  <button type="button" onClick={() => mediaInputRef.current?.click()} disabled={uploadingMedia} className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 hover:bg-blue-500 disabled:opacity-60 text-white rounded-xl text-xs font-semibold cursor-pointer">
                    {uploadingMedia ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Upload className="h-3.5 w-3.5" />}
                    {uploadingMedia ? 'Uploading...' : 'Add Media'}
                  </button>
                </div>
                <p className="text-[10px] text-[var(--muted)]">Images: JPG, PNG, WEBP (max 5MB). Videos: MP4, WEBM, MOV (max 50MB).</p>
                {formGallery.length > 0 && (
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                    {formGallery.map((media, index) => (
                      <div key={`${media.url}-${index}`} className="relative aspect-[4/3] overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--background)]">
                        {media.type === 'video' ? <video src={media.url} preload="metadata" className="h-full w-full object-cover" /> : <img src={media.url} alt={`Gallery preview ${index + 1}`} className="h-full w-full object-cover" />}
                        {media.type === 'video' && <span className="absolute left-2 bottom-2 inline-flex items-center gap-1 rounded bg-black/65 px-1.5 py-0.5 text-[9px] font-semibold text-white"><Play className="h-2.5 w-2.5 fill-current" /> VIDEO</span>}
                        <button type="button" aria-label={`Remove media ${index + 1}`} onClick={() => removeGalleryMedia(index)} className="absolute right-1.5 top-1.5 rounded-full bg-black/70 p-1 text-white hover:bg-red-500 cursor-pointer"><X className="h-3 w-3" /></button>
                      </div>
                    ))}
                  </div>
                )}
                <label className="text-[10px] font-semibold text-[var(--muted)]">Add image URL (optional)</label>
                <div className="flex gap-2 mb-2">
                  <input
                    type="text"
                    value={galleryInput}
                    onChange={(e) => setGalleryInput(e.target.value)}
                    placeholder="https://example.com/property.jpg"
                    className="flex-1 p-2 border rounded-xl text-xs bg-[var(--background)] border-[var(--border)] focus:outline-none"
                  />
                  <button
                    type="button"
                    onClick={addGalleryImage}
                    className="px-3.5 py-1 bg-blue-600 text-white rounded-xl text-xs font-semibold cursor-pointer"
                  >
                    Add
                  </button>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1">
                <label className="text-xs font-semibold text-[var(--muted)] uppercase">Property Description</label>
                <textarea
                  {...register('description')}
                  rows={2}
                  className="w-full p-2 border rounded-xl text-xs bg-[var(--background)] border-[var(--border)] focus:outline-none"
                />
              </div>

              {/* Footer Actions */}
              <div className="pt-4 border-t border-[var(--border)] flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 border border-[var(--border)] rounded-xl text-xs font-semibold hover:bg-[var(--secondary)] cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-semibold cursor-pointer shadow"
                >
                  {isSubmitting ? 'Saving...' : 'Save Property Spec'}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}
