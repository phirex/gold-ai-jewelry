"use client";

import { useState, useEffect, useCallback } from "react";
import type { PricingBreakdown } from "@/lib/pricing/calculator";

interface Design {
  id: string;
  name: string | null;
  prompt: string;
  jewelryType: string;
  targetGender: string;
  material: string;
  thumbnailUrl: string | null;
  modelUrl: string | null;
  stones: Array<{ type: string; quantity: number; size: string }>;
  complexity: string;
  estimatedPrice: number | null;
  status: string;
  createdAt: string;
  updatedAt: string;
  user: {
    id: string;
    name: string | null;
    email: string;
    image: string | null;
  } | null;
  pricingBreakdown?: PricingBreakdown | null;
  _count: {
    orderItems: number;
  };
}

interface Stats {
  total: number;
  byStatus: {
    draft: number;
    saved: number;
    ordered: number;
  };
  byType: {
    ring: number;
    necklace: number;
    bracelet: number;
    earrings: number;
  };
  totalEstimatedValue: number;
  averagePrice: number;
}

interface ProductsPanelProps {
  onSelectDesign?: (design: Design) => void;
}

const materialLabels: Record<string, string> = {
  gold_14k: "14K Gold",
  gold_18k: "18K Gold",
  gold_24k: "24K Gold",
  silver: "Sterling Silver",
  platinum: "Platinum",
};

const typeLabels: Record<string, string> = {
  ring: "Ring",
  necklace: "Necklace",
  bracelet: "Bracelet",
  earrings: "Earrings",
};

export function ProductsPanel({ onSelectDesign }: ProductsPanelProps) {
  const [designs, setDesigns] = useState<Design[]>([]);
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<{
    status: string | null;
    jewelryType: string | null;
  }>({ status: null, jewelryType: null });
  const [selectedDesign, setSelectedDesign] = useState<Design | null>(null);
  const [recalculating, setRecalculating] = useState<string | null>(null);
  const [loadingBreakdown, setLoadingBreakdown] = useState(false);

  const fetchDesigns = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const params = new URLSearchParams();
      if (filter.status) params.set("status", filter.status);
      if (filter.jewelryType) params.set("jewelryType", filter.jewelryType);
      params.set("breakdown", "false");
      
      const response = await fetch(`/api/admin/designs?${params}`);
      const data = await response.json();
      
      if (data.success) {
        setDesigns(data.designs);
        setStats(data.stats);
        setError(null);
      } else {
        if (data.error && !data.error.includes("Admin authentication")) {
          setError(data.error);
        }
      }
    } catch (err) {
      setError("Network error. Please try again.");
      console.error("Fetch designs error:", err);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    fetchDesigns();
  }, [fetchDesigns]);

  // Fetch breakdown when design is selected
  const fetchBreakdown = async (designId: string) => {
    setLoadingBreakdown(true);
    try {
      const response = await fetch(`/api/admin/designs?breakdown=true&designId=${designId}`);
      const data = await response.json();
      if (data.success && data.designs.length > 0) {
        setSelectedDesign(data.designs[0]);
      }
    } catch (err) {
      console.error("Fetch breakdown error:", err);
    } finally {
      setLoadingBreakdown(false);
    }
  };

  const handleRecalculate = async (designId: string) => {
    setRecalculating(designId);
    try {
      const response = await fetch("/api/admin/designs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ designId, action: "recalculate" }),
      });
      
      const data = await response.json();
      if (data.success) {
        setDesigns(prev => prev.map(d => 
          d.id === designId 
            ? { ...d, estimatedPrice: data.design.estimatedPrice, pricingBreakdown: data.breakdown }
            : d
        ));
        if (selectedDesign?.id === designId) {
          setSelectedDesign(prev => prev ? { ...prev, estimatedPrice: data.design.estimatedPrice, pricingBreakdown: data.breakdown } : null);
        }
      }
    } catch (err) {
      console.error("Recalculate error:", err);
    } finally {
      setRecalculating(null);
    }
  };

  const formatPrice = (price: number | null | undefined) => {
    if (price === null || price === undefined) return "—";
    // Use en-IL to get proper LTR numbers with ₪ symbol
    const formatted = new Intl.NumberFormat("en-IL", {
      style: "currency",
      currency: "ILS",
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
    // Ensure consistent format: ₪XX,XXX
    return formatted;
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const handleSelectDesign = (design: Design) => {
    setSelectedDesign(design);
    fetchBreakdown(design.id);
    onSelectDesign?.(design);
  };

  return (
    <div className="space-y-8">
      {/* Stats Overview */}
      {stats && (
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-5">
          <StatCard
            label="Total Designs"
            value={stats.total}
            sublabel={stats.byStatus.draft > 0 ? `${stats.byStatus.draft} drafts` : undefined}
            icon={<DesignsIcon />}
          />
          <StatCard
            label="Portfolio Value"
            value={formatPrice(stats.totalEstimatedValue)}
            sublabel="Combined estimates"
            icon={<ValueIcon />}
            highlight
          />
          <StatCard
            label="Average Price"
            value={formatPrice(Math.round(stats.averagePrice))}
            sublabel="Per design"
            icon={<ChartIcon />}
          />
          <StatCard
            label="Orders"
            value={stats.byStatus.ordered}
            sublabel={stats.byStatus.saved > 0 ? `${stats.byStatus.saved} ready` : undefined}
            icon={<OrdersIcon />}
          />
        </div>
      )}

      {/* Filter Bar */}
      <div className="flex flex-wrap items-center gap-3" style={{ borderBottom: '1px solid var(--admin-border-light)', paddingBottom: '1rem' }}>
        <span className="admin-label" style={{ marginRight: '0.5rem' }}>
          <FilterIcon /> Filter
        </span>
        
        {/* Status Filters */}
        <div className="flex gap-2">
          {[
            { value: null, label: "All" },
            { value: "draft", label: "Draft" },
            { value: "saved", label: "Saved" },
            { value: "ordered", label: "Ordered" },
          ].map((item) => (
            <button
              key={item.value ?? "all"}
              onClick={() => setFilter(prev => ({ ...prev, status: item.value }))}
              className={`admin-filter-pill ${filter.status === item.value ? 'active' : ''}`}
            >
              {item.label}
            </button>
          ))}
        </div>

        <div style={{ width: '1px', height: '24px', background: 'var(--admin-border)', margin: '0 0.5rem' }} />

        {/* Type Filters */}
        <div className="flex gap-2">
          {[
            { value: null, label: "All Types", icon: null },
            { value: "ring", label: "Ring", icon: <RingIcon /> },
            { value: "necklace", label: "Necklace", icon: <NecklaceIcon /> },
            { value: "bracelet", label: "Bracelet", icon: <BraceletIcon /> },
            { value: "earrings", label: "Earrings", icon: <EarringsIcon /> },
          ].map((item) => (
            <button
              key={item.value ?? "all"}
              onClick={() => setFilter(prev => ({ ...prev, jewelryType: item.value }))}
              className={`admin-filter-pill ${filter.jewelryType === item.value ? 'active' : ''}`}
            >
              {item.icon}
              <span className="hidden sm:inline">{item.label}</span>
            </button>
          ))}
        </div>

        <div className="flex-1" />

        {/* Refresh Button */}
        <button
          onClick={fetchDesigns}
          className="admin-btn admin-btn-secondary"
          style={{ padding: '0.5rem 1rem', fontSize: '0.8125rem' }}
        >
          <RefreshIcon className={loading ? 'animate-spin' : ''} />
          Refresh
        </button>
      </div>

      {/* Error Display */}
      {error && (
        <div style={{
          padding: '1rem 1.25rem',
          borderRadius: 'var(--admin-radius-md)',
          background: 'rgba(220, 38, 38, 0.06)',
          border: '1px solid rgba(220, 38, 38, 0.15)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
        }}>
          <AlertIcon />
          <p style={{ fontSize: '0.875rem', color: '#B91C1C' }}>{error}</p>
        </div>
      )}

      {/* Loading State */}
      {loading && designs.length === 0 && (
        <div className="admin-empty-state" style={{ padding: '5rem 2rem' }}>
          <div className="admin-loading" style={{
            width: '48px',
            height: '48px',
            border: '3px solid var(--admin-border-light)',
            borderTopColor: 'var(--admin-gold)',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
          }} />
          <p style={{ marginTop: '1rem', color: 'var(--admin-text-secondary)', fontSize: '0.9375rem' }}>
            Loading your collection...
          </p>
        </div>
      )}

      {/* Empty State */}
      {!loading && designs.length === 0 && !error && (
        <div className="admin-empty-state">
          <div className="admin-empty-icon">
            <DiamondIcon />
          </div>
          <h3 className="admin-empty-title">Your Collection Awaits</h3>
          <p className="admin-empty-text">
            When customers create jewelry designs, each piece will appear here with detailed pricing estimations.
          </p>
        </div>
      )}

      {/* Products Grid */}
      {designs.length > 0 && (
        <div className="admin-grid-products">
          {designs.map((design, index) => (
            <ProductCard
              key={design.id}
              design={design}
              isSelected={selectedDesign?.id === design.id}
              isRecalculating={recalculating === design.id}
              onClick={() => handleSelectDesign(design)}
              onRecalculate={() => handleRecalculate(design.id)}
              formatPrice={formatPrice}
              formatDate={formatDate}
              animationDelay={index * 50}
            />
          ))}
        </div>
      )}

      {/* Design Detail Modal */}
      {selectedDesign && (
        <DesignDetailModal
          design={selectedDesign}
          onClose={() => setSelectedDesign(null)}
          onRecalculate={() => handleRecalculate(selectedDesign.id)}
          isRecalculating={recalculating === selectedDesign.id}
          isLoadingBreakdown={loadingBreakdown}
          formatPrice={formatPrice}
          formatDate={formatDate}
        />
      )}

      {/* Keyframes for spin animation */}
      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

// ============================================
// Stat Card Component
// ============================================
function StatCard({ 
  label, 
  value, 
  sublabel, 
  icon,
  highlight 
}: { 
  label: string; 
  value: string | number; 
  sublabel?: string;
  icon: React.ReactNode;
  highlight?: boolean;
}) {
  return (
    <div className="admin-stat-card" style={highlight ? { borderColor: 'var(--admin-gold-border)' } : {}}>
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between' }}>
        <div>
          <p className="admin-stat-label">{label}</p>
          <p className="admin-stat-value" style={highlight ? { color: 'var(--admin-gold)' } : {}}>
            {value}
          </p>
          {sublabel && (
            <p className="admin-stat-trend">{sublabel}</p>
          )}
        </div>
        <div style={{
          width: '40px',
          height: '40px',
          borderRadius: '10px',
          background: highlight ? 'var(--admin-gold-muted)' : 'var(--admin-bg)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: highlight ? 'var(--admin-gold)' : 'var(--admin-text-tertiary)',
        }}>
          {icon}
        </div>
      </div>
    </div>
  );
}

// ============================================
// Product Card Component
// ============================================
function ProductCard({
  design,
  isSelected,
  isRecalculating,
  onClick,
  onRecalculate,
  formatPrice,
  formatDate,
  animationDelay,
}: {
  design: Design;
  isSelected: boolean;
  isRecalculating: boolean;
  onClick: () => void;
  onRecalculate: () => void;
  formatPrice: (price: number | null) => string;
  formatDate: (date: string) => string;
  animationDelay: number;
}) {
  const displayName = design.name || `${typeLabels[design.jewelryType] || design.jewelryType} Design`;
  
  return (
    <div
      onClick={onClick}
      className="admin-product-card"
      style={{
        cursor: 'pointer',
        opacity: 0,
        animation: `adminSlideUp 0.4s ease-out ${animationDelay}ms forwards`,
        borderColor: isSelected ? 'var(--admin-gold-border)' : undefined,
        boxShadow: isSelected ? 'var(--admin-shadow-gold)' : undefined,
      }}
    >
      {/* Image */}
      <div className="admin-product-image">
        {design.thumbnailUrl ? (
          <img
            src={design.thumbnailUrl}
            alt={displayName}
            loading="lazy"
          />
        ) : (
          <div style={{
            width: '100%',
            height: '100%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: 'var(--admin-text-tertiary)',
          }}>
            <DiamondIcon size={48} />
          </div>
        )}
        
        {/* Status Badge */}
        <div style={{ position: 'absolute', top: '0.75rem', left: '0.75rem' }}>
          <StatusBadge status={design.status} />
        </div>
        
        {/* 3D Badge */}
        {design.modelUrl && (
          <div style={{ position: 'absolute', top: '0.75rem', right: '0.75rem' }}>
            <span style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.25rem',
              padding: '0.25rem 0.5rem',
              borderRadius: '6px',
              background: 'rgba(255, 255, 255, 0.9)',
              backdropFilter: 'blur(4px)',
              fontSize: '0.6875rem',
              fontWeight: 600,
              color: 'var(--admin-text-primary)',
            }}>
              <CubeIcon /> 3D
            </span>
          </div>
        )}
      </div>

      {/* Content */}
      <div className="admin-product-content">
        <h3 className="admin-product-title">{displayName}</h3>
        <p className="admin-product-description">{design.prompt}</p>
        
        <div className="admin-product-divider" />
        
        {/* Materials & Pricing Grid */}
        <div className="admin-product-meta">
          {/* Materials Column */}
          <div className="admin-product-materials">
            <p className="admin-product-materials-title">Materials</p>
            <div className="admin-product-material-item">
              <span className="admin-product-material-dot" />
              <span>{materialLabels[design.material] || design.material}</span>
            </div>
            {design.stones && design.stones.length > 0 && (
              <div className="admin-product-material-item">
                <span className="admin-product-material-dot" style={{ background: 'var(--admin-info)' }} />
                <span>{design.stones.length} stone{design.stones.length > 1 ? 's' : ''}</span>
              </div>
            )}
            <div className="admin-product-material-item">
              <span className="admin-product-material-dot" style={{ background: 'var(--admin-text-tertiary)' }} />
              <span style={{ textTransform: 'capitalize' }}>{design.complexity}</span>
            </div>
          </div>

          {/* Pricing Column */}
          <div className="admin-product-pricing">
            <p className="admin-product-pricing-title">Estimate</p>
            <div className="admin-product-price-total" style={{ border: 'none', padding: 0, margin: 0 }}>
              <span>Total</span>
              <span className="admin-price-gold" style={{ direction: 'ltr', unicodeBidi: 'embed' }}>{formatPrice(design.estimatedPrice)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="admin-product-footer">
        <div className="admin-product-user">
          {design.user ? (
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {design.user.image ? (
                <img 
                  src={design.user.image} 
                  alt="" 
                  style={{ width: '20px', height: '20px', borderRadius: '50%' }}
                />
              ) : (
                <span style={{
                  width: '20px',
                  height: '20px',
                  borderRadius: '50%',
                  background: 'var(--admin-border)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: '0.625rem',
                  fontWeight: 600,
                  color: 'var(--admin-text-tertiary)',
                }}>
                  {(design.user.name || design.user.email)[0].toUpperCase()}
                </span>
              )}
              {design.user.name || design.user.email.split("@")[0]}
            </span>
          ) : (
            <span style={{ color: 'var(--admin-text-tertiary)' }}>Guest</span>
          )}
        </div>
        <span className="admin-product-date">{formatDate(design.createdAt)}</span>
      </div>

      {/* Hover Actions */}
      <div style={{
        position: 'absolute',
        inset: 0,
        background: 'linear-gradient(to top, rgba(28, 25, 23, 0.9) 0%, transparent 50%)',
        display: 'flex',
        alignItems: 'flex-end',
        padding: '1rem',
        opacity: 0,
        transition: 'opacity 0.2s ease',
      }} className="hover-overlay">
        <div style={{ display: 'flex', gap: '0.5rem', width: '100%' }}>
          <button
            onClick={(e) => { e.stopPropagation(); onRecalculate(); }}
            disabled={isRecalculating}
            className="admin-btn admin-btn-secondary"
            style={{ flex: 1, fontSize: '0.8125rem', padding: '0.625rem' }}
          >
            <RefreshIcon className={isRecalculating ? 'animate-spin' : ''} />
            {isRecalculating ? 'Calculating...' : 'Recalculate'}
          </button>
          <button
            className="admin-btn admin-btn-primary"
            style={{ flex: 1, fontSize: '0.8125rem', padding: '0.625rem' }}
          >
            View Details
          </button>
        </div>
      </div>

      <style jsx>{`
        .admin-product-card:hover .hover-overlay {
          opacity: 1;
        }
      `}</style>
    </div>
  );
}

// ============================================
// Status Badge Component
// ============================================
function StatusBadge({ status }: { status: string }) {
  const getStatusStyle = () => {
    switch (status) {
      case 'ordered':
        return { background: 'var(--admin-success-bg)', color: 'var(--admin-success)', border: '1px solid var(--admin-success)' };
      case 'saved':
        return { background: 'var(--admin-gold-muted)', color: 'var(--admin-gold)', border: '1px solid var(--admin-gold-border)' };
      default:
        return { background: 'var(--admin-bg)', color: 'var(--admin-text-secondary)', border: '1px solid var(--admin-border)' };
    }
  };
  
  return (
    <span className="admin-badge" style={getStatusStyle()}>
      {status.charAt(0).toUpperCase() + status.slice(1)}
    </span>
  );
}

// ============================================
// Design Detail Modal
// ============================================
function DesignDetailModal({
  design,
  onClose,
  onRecalculate,
  isRecalculating,
  isLoadingBreakdown,
  formatPrice,
  formatDate,
}: {
  design: Design;
  onClose: () => void;
  onRecalculate: () => void;
  isRecalculating: boolean;
  isLoadingBreakdown: boolean;
  formatPrice: (price: number | null) => string;
  formatDate: (date: string) => string;
}) {
  const breakdown = design.pricingBreakdown;
  const displayName = design.name || `${typeLabels[design.jewelryType] || design.jewelryType} Design`;
  
  return (
    <div className="admin-modal-overlay" onClick={onClose}>
      <div 
        className="admin-modal"
        style={{ maxWidth: '800px' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="admin-modal-header">
          <div>
            <h2 className="admin-modal-title">{displayName}</h2>
            <p style={{ fontSize: '0.75rem', color: 'var(--admin-text-tertiary)', marginTop: '0.25rem' }}>
              {design.id}
            </p>
          </div>
          <button className="admin-modal-close" onClick={onClose}>
            <CloseIcon />
          </button>
        </div>

        {/* Body */}
        <div className="admin-modal-body">
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem' }}>
            {/* Left Column - Image & Info */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Image */}
              <div style={{
                aspectRatio: '1',
                borderRadius: 'var(--admin-radius-lg)',
                overflow: 'hidden',
                background: 'var(--admin-bg)',
              }}>
                {design.thumbnailUrl ? (
                  <img
                    src={design.thumbnailUrl}
                    alt={displayName}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                  />
                ) : (
                  <div style={{
                    width: '100%',
                    height: '100%',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'var(--admin-text-tertiary)',
                  }}>
                    <DiamondIcon size={64} />
                  </div>
                )}
              </div>

              {/* Status Badges */}
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                <StatusBadge status={design.status} />
                <span className="admin-badge" style={{ 
                  background: 'var(--admin-bg)', 
                  color: 'var(--admin-text-secondary)',
                  border: '1px solid var(--admin-border)',
                  textTransform: 'capitalize',
                }}>
                  {design.complexity} complexity
                </span>
                {design.modelUrl && (
                  <span className="admin-badge" style={{ 
                    background: 'var(--admin-info-bg)', 
                    color: 'var(--admin-info)',
                  }}>
                    <CubeIcon /> 3D Ready
                  </span>
                )}
              </div>

              {/* Prompt */}
              <div className="admin-section">
                <div className="admin-section-header">
                  <span className="admin-section-title">Design Prompt</span>
                </div>
                <div className="admin-section-content">
                  <p style={{ fontSize: '0.875rem', color: 'var(--admin-text-secondary)', lineHeight: 1.6 }}>
                    {design.prompt}
                  </p>
                </div>
              </div>

              {/* User Info */}
              {design.user && (
                <div style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.75rem',
                  padding: '0.875rem',
                  borderRadius: 'var(--admin-radius-md)',
                  background: 'var(--admin-bg)',
                }}>
                  {design.user.image ? (
                    <img src={design.user.image} alt="" style={{ width: '36px', height: '36px', borderRadius: '50%' }} />
                  ) : (
                    <span style={{
                      width: '36px',
                      height: '36px',
                      borderRadius: '50%',
                      background: 'var(--admin-border)',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      fontSize: '0.875rem',
                      fontWeight: 600,
                      color: 'var(--admin-text-tertiary)',
                    }}>
                      {(design.user.name || design.user.email)[0].toUpperCase()}
                    </span>
                  )}
                  <div>
                    <p style={{ fontWeight: 500, color: 'var(--admin-text-primary)', fontSize: '0.875rem' }}>
                      {design.user.name || 'Anonymous'}
                    </p>
                    <p style={{ fontSize: '0.75rem', color: 'var(--admin-text-tertiary)' }}>
                      {design.user.email}
                    </p>
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Pricing */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Total Price Card */}
              <div style={{
                padding: '1.5rem',
                borderRadius: 'var(--admin-radius-lg)',
                background: 'linear-gradient(135deg, var(--admin-gold-muted) 0%, rgba(184, 134, 11, 0.05) 100%)',
                border: '1px solid var(--admin-gold-border)',
              }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1rem' }}>
                  <span className="admin-label" style={{ color: 'var(--admin-gold)' }}>Estimated Price</span>
                  <button
                    onClick={onRecalculate}
                    disabled={isRecalculating}
                    className="admin-btn admin-btn-ghost"
                    style={{ padding: '0.375rem 0.75rem', fontSize: '0.75rem' }}
                  >
                    <RefreshIcon className={isRecalculating ? 'animate-spin' : ''} />
                    {isRecalculating ? 'Calculating...' : 'Recalculate'}
                  </button>
                </div>
                <p style={{
                  fontFamily: 'var(--admin-font-display)',
                  fontSize: '2.5rem',
                  fontWeight: 600,
                  color: 'var(--admin-text-primary)',
                  lineHeight: 1,
                  direction: 'ltr',
                }}>
                  {formatPrice(design.estimatedPrice)}
                </p>
                {breakdown?.priceRange && (
                  <p style={{ fontSize: '0.8125rem', color: 'var(--admin-gold)', marginTop: '0.5rem', direction: 'ltr', textAlign: 'center' }}>
                    Range: {formatPrice(breakdown.priceRange.low)} — {formatPrice(breakdown.priceRange.high)}
                  </p>
                )}
              </div>

              {/* Pricing Breakdown */}
              <div className="admin-section">
                <div className="admin-section-header">
                  <span className="admin-section-title">Price Breakdown</span>
                </div>
                <div className="admin-section-content">
                  {isLoadingBreakdown ? (
                    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '2rem' }}>
                      <div style={{
                        width: '24px',
                        height: '24px',
                        border: '2px solid var(--admin-border-light)',
                        borderTopColor: 'var(--admin-gold)',
                        borderRadius: '50%',
                        animation: 'spin 1s linear infinite',
                      }} />
                    </div>
                  ) : breakdown ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                      <PriceRow 
                        label={`Material (${materialLabels[design.material]})`} 
                        value={formatPrice(breakdown.materials?.subtotal)} 
                        detail={breakdown.materials ? `${breakdown.materials.weightGrams}g @ ${formatPrice(breakdown.materials.pricePerGram)}/g` : undefined}
                      />
                      {breakdown.stones?.subtotal > 0 && (
                        <PriceRow label="Stones & Gems" value={formatPrice(breakdown.stones.subtotal)} />
                      )}
                      <PriceRow 
                        label="Labor & Craftsmanship" 
                        value={formatPrice(breakdown.labor?.subtotal)}
                        detail={breakdown.labor ? `${breakdown.labor.hours}hrs @ ${formatPrice(breakdown.labor.hourlyRate)}/hr` : undefined}
                      />
                      {breakdown.overhead?.subtotal > 0 && (
                        <PriceRow label="Overhead (15%)" value={formatPrice(breakdown.overhead.subtotal)} />
                      )}
                      <div style={{
                        borderTop: '1px solid var(--admin-border-light)',
                        paddingTop: '0.75rem',
                        marginTop: '0.25rem',
                        display: 'flex',
                        flexDirection: 'column',
                        gap: '0.5rem',
                      }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                          <span style={{ color: 'var(--admin-text-secondary)' }}>Cost Subtotal</span>
                          <span style={{ direction: 'ltr', unicodeBidi: 'embed' }}>{formatPrice(breakdown.costSubtotal)}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem' }}>
                          <span style={{ color: 'var(--admin-text-secondary)' }}>Margin (×{breakdown.marginMultiplier})</span>
                          <span style={{ direction: 'ltr', unicodeBidi: 'embed' }}>{formatPrice(breakdown.margin)}</span>
                        </div>
                        <div style={{
                          borderTop: '1px solid var(--admin-border-light)',
                          paddingTop: '0.5rem',
                          display: 'flex',
                          justifyContent: 'space-between',
                        }}>
                          <span style={{ fontWeight: 600, color: 'var(--admin-text-primary)' }}>Final Price</span>
                          <span className="admin-price-gold" style={{ fontSize: '1.125rem', direction: 'ltr', unicodeBidi: 'embed' }}>
                            {formatPrice(breakdown.total)}
                          </span>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <p style={{ fontSize: '0.875rem', color: 'var(--admin-text-tertiary)', textAlign: 'center', padding: '1rem' }}>
                      No breakdown available
                    </p>
                  )}
                </div>
              </div>

              {/* AI Image Analysis */}
              {breakdown?.aiEstimate && (
                <div className="admin-section" style={{ background: 'linear-gradient(135deg, #FFFBF0 0%, #FFF9E6 100%)', borderLeft: '3px solid var(--admin-gold)' }}>
                  <div className="admin-section-header">
                    <span className="admin-section-title" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                      <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="var(--admin-gold)" strokeWidth="2">
                        <circle cx="12" cy="12" r="10"/>
                        <path d="M12 6v6l4 2"/>
                      </svg>
                      AI Image Analysis
                    </span>
                    <span style={{ fontSize: '0.6875rem', color: 'var(--admin-gold)', fontWeight: 500 }}>
                      {Math.round(breakdown.aiEstimate.confidence * 100)}% confidence
                    </span>
                  </div>
                  <div className="admin-section-content">
                    <p style={{ fontSize: '0.8125rem', color: 'var(--admin-text-secondary)', marginBottom: '0.75rem', fontStyle: 'italic' }}>
                      "{breakdown.aiEstimate.reasoning}"
                    </p>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.5rem', fontSize: '0.75rem' }}>
                      <div style={{ color: 'var(--admin-text-tertiary)' }}>
                        <span style={{ display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.125rem' }}>Volume</span>
                        <span style={{ color: 'var(--admin-text-primary)', fontWeight: 500 }}>{breakdown.aiEstimate.volumeMultiplier}× standard</span>
                      </div>
                      <div style={{ color: 'var(--admin-text-tertiary)' }}>
                        <span style={{ display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.125rem' }}>Stones Detected</span>
                        <span style={{ color: 'var(--admin-text-primary)', fontWeight: 500 }}>{breakdown.aiEstimate.stonesDetected}</span>
                      </div>
                      <div style={{ color: 'var(--admin-text-tertiary)' }}>
                        <span style={{ display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.125rem' }}>Est. Labor</span>
                        <span style={{ color: 'var(--admin-text-primary)', fontWeight: 500 }}>{breakdown.aiEstimate.laborHours} hours</span>
                      </div>
                      <div style={{ color: 'var(--admin-text-tertiary)' }}>
                        <span style={{ display: 'block', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.125rem' }}>Complexity</span>
                        <span style={{ color: 'var(--admin-text-primary)', fontWeight: 500, textTransform: 'capitalize' }}>{breakdown.aiEstimate.complexity}</span>
                      </div>
                    </div>
                    {breakdown.aiEstimate.designFeatures && breakdown.aiEstimate.designFeatures.length > 0 && (
                      <div style={{ marginTop: '0.75rem', display: 'flex', flexWrap: 'wrap', gap: '0.375rem' }}>
                        {breakdown.aiEstimate.designFeatures.map((feature, idx) => (
                          <span key={idx} style={{
                            fontSize: '0.6875rem',
                            padding: '0.25rem 0.5rem',
                            background: 'rgba(184, 134, 11, 0.1)',
                            color: 'var(--admin-gold)',
                            borderRadius: '999px',
                            fontWeight: 500,
                          }}>
                            {feature}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Design Details */}
              <div className="admin-section">
                <div className="admin-section-header">
                  <span className="admin-section-title">Details</span>
                </div>
                <div className="admin-section-content">
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem', fontSize: '0.8125rem' }}>
                    <DetailRow label="Type" value={typeLabels[design.jewelryType]} />
                    <DetailRow label="Gender" value={design.targetGender} />
                    <DetailRow label="Material" value={materialLabels[design.material]} />
                    <DetailRow label="Complexity" value={breakdown?.aiEstimate?.complexity || design.complexity} />
                    <DetailRow label="Created" value={formatDate(design.createdAt)} />
                    <DetailRow label="Updated" value={formatDate(design.updatedAt)} />
                  </div>
                </div>
              </div>

              {/* Stones */}
              {design.stones && design.stones.length > 0 && (
                <div className="admin-section">
                  <div className="admin-section-header">
                    <span className="admin-section-title">Stones & Gems</span>
                  </div>
                  <div className="admin-section-content">
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                      {design.stones.map((stone, idx) => (
                        <div key={idx} style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          fontSize: '0.8125rem',
                        }}>
                          <span style={{ color: 'var(--admin-text-secondary)', textTransform: 'capitalize' }}>
                            {stone.type} ({stone.size})
                          </span>
                          <span style={{ color: 'var(--admin-text-tertiary)' }}>×{stone.quantity}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="admin-modal-footer">
          <button onClick={onClose} className="admin-btn admin-btn-secondary">
            Close
          </button>
          <button className="admin-btn admin-btn-primary">
            Export Details
          </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}

// Helper Components
function PriceRow({ label, value, detail }: { label: string; value: string; detail?: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', alignItems: 'flex-start' }}>
      <div>
        <span style={{ color: 'var(--admin-text-secondary)' }}>{label}</span>
        {detail && (
          <span style={{ display: 'block', color: 'var(--admin-text-tertiary)', fontSize: '0.6875rem', marginTop: '0.125rem' }}>
            {detail}
          </span>
        )}
      </div>
      <span className="admin-price" style={{ direction: 'ltr', unicodeBidi: 'embed' }}>{value}</span>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span style={{ display: 'block', color: 'var(--admin-text-tertiary)', fontSize: '0.6875rem', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.125rem' }}>
        {label}
      </span>
      <span style={{ color: 'var(--admin-text-primary)', textTransform: 'capitalize' }}>{value}</span>
    </div>
  );
}

// ============================================
// Icons
// ============================================
function DesignsIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
      <circle cx="8.5" cy="8.5" r="1.5"/>
      <polyline points="21,15 16,10 5,21"/>
    </svg>
  );
}

function ValueIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="12" y1="1" x2="12" y2="23"/>
      <path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>
    </svg>
  );
}

function ChartIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="20" x2="18" y2="10"/>
      <line x1="12" y1="20" x2="12" y2="4"/>
      <line x1="6" y1="20" x2="6" y2="14"/>
    </svg>
  );
}

function OrdersIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/>
      <polyline points="22,4 12,14.01 9,11.01"/>
    </svg>
  );
}

function FilterIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline', marginRight: '0.375rem', verticalAlign: 'middle' }}>
      <polygon points="22,3 2,3 10,12.46 10,19 14,21 14,12.46"/>
    </svg>
  );
}

function RefreshIcon({ className }: { className?: string }) {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className} style={{ display: 'inline', marginRight: '0.375rem' }}>
      <polyline points="23,4 23,10 17,10"/>
      <polyline points="1,20 1,14 7,14"/>
      <path d="M3.51,9a9,9,0,0,1,14.85-3.36L23,10M1,14l4.64,4.36A9,9,0,0,0,20.49,15"/>
    </svg>
  );
}

function AlertIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#B91C1C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="10"/>
      <line x1="12" y1="8" x2="12" y2="12"/>
      <line x1="12" y1="16" x2="12.01" y2="16"/>
    </svg>
  );
}

function DiamondIcon({ size = 32 }: { size?: number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <path d="M6 3h12l4 6-10 13L2 9z"/>
      <path d="M11 3l1 6 1-6"/>
      <path d="M2 9h20"/>
      <path d="M6 3L2 9l10 13"/>
      <path d="M18 3l4 6-10 13"/>
    </svg>
  );
}

function CloseIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <line x1="18" y1="6" x2="6" y2="18"/>
      <line x1="6" y1="6" x2="18" y2="18"/>
    </svg>
  );
}

function CubeIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{ display: 'inline', marginRight: '0.25rem' }}>
      <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
      <polyline points="3.27,6.96 12,12.01 20.73,6.96"/>
      <line x1="12" y1="22.08" x2="12" y2="12"/>
    </svg>
  );
}

function RingIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <circle cx="12" cy="12" r="8"/>
      <path d="M12 2v2"/>
      <path d="M12 20v2"/>
    </svg>
  );
}

function NecklaceIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 22c-4 0-8-2-8-8V6"/>
      <path d="M20 6v8c0 6-4 8-8 8"/>
      <circle cx="12" cy="8" r="2"/>
    </svg>
  );
}

function BraceletIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <ellipse cx="12" cy="12" rx="10" ry="4"/>
    </svg>
  );
}

function EarringsIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2v8"/>
      <circle cx="12" cy="14" r="4"/>
      <path d="M12 18v4"/>
    </svg>
  );
}
