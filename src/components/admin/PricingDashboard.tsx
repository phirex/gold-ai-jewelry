"use client";

import { useState, useCallback } from "react";
import Image from "next/image";
import { LiveCalculator } from "./LiveCalculator";
import { PricingPipeline } from "./PricingPipeline";
import { MarketDataCard } from "./MarketDataCard";
import { StageDetails } from "./StageDetails";
import { ProductsPanel } from "./ProductsPanel";
import type { PricingBreakdown } from "@/lib/pricing/calculator";

interface User {
  name: string;
  email: string;
  image?: string;
}

interface PricingDashboardProps {
  locale: string;
  user: User;
}

export type PipelineStage = 
  | "input" 
  | "materials" 
  | "stones" 
  | "labor" 
  | "overhead" 
  | "total";

export interface CalculatorInput {
  jewelryType: "ring" | "necklace" | "bracelet" | "earrings";
  material: "gold_14k" | "gold_18k" | "gold_24k" | "silver" | "platinum";
  size: "small" | "medium" | "large";
  description: string;
  stones: Array<{
    type: "diamond" | "sapphire" | "ruby" | "emerald";
    size: "tiny" | "small" | "medium" | "large" | "statement";
    quality: "economy" | "standard" | "premium" | "luxury";
    quantity: number;
  }>;
}

type DashboardTab = "products" | "calculator";

export function PricingDashboard({ locale, user }: PricingDashboardProps) {
  const [activeTab, setActiveTab] = useState<DashboardTab>("products");
  const [input, setInput] = useState<CalculatorInput>({
    jewelryType: "ring",
    material: "gold_18k",
    size: "medium",
    description: "",
    stones: [],
  });
  
  const [breakdown, setBreakdown] = useState<PricingBreakdown | null>(null);
  const [isCalculating, setIsCalculating] = useState(false);
  const [activeStage, setActiveStage] = useState<PipelineStage | null>(null);
  const [error, setError] = useState<string | null>(null);

  const handleCalculate = useCallback(async () => {
    setIsCalculating(true);
    setError(null);
    
    try {
      const response = await fetch("/api/pricing/estimate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          ...input,
          includeAIEstimate: true,
        }),
      });
      
      const data = await response.json();
      
      if (data.success) {
        setBreakdown(data.breakdown);
        setActiveStage("total");
      } else {
        setError(data.error || "Failed to calculate price");
      }
    } catch (err) {
      setError("Network error. Please try again.");
      console.error("Calculation error:", err);
    } finally {
      setIsCalculating(false);
    }
  }, [input]);

  const handleInputChange = useCallback((newInput: Partial<CalculatorInput>) => {
    setInput(prev => ({ ...prev, ...newInput }));
  }, []);

  return (
    <div className="admin-dashboard" style={{ minHeight: '100vh' }}>
      {/* Header */}
      <header style={{
        background: 'var(--admin-bg-card)',
        borderBottom: '1px solid var(--admin-border-light)',
        position: 'sticky',
        top: 0,
        zIndex: 50,
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 1.5rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', height: '72px' }}>
            {/* Logo & Title */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.875rem' }}>
              <Image
                src="/gold-ai-logo.png"
                alt="Gold AI"
                width={40}
                height={40}
                style={{ borderRadius: '10px', objectFit: 'contain' }}
                priority
              />
              <div>
                <h1 className="admin-heading" style={{ fontSize: '1.25rem', marginBottom: '0.125rem' }}>
                  Admin Dashboard
                </h1>
                <p style={{ fontSize: '0.75rem', color: 'var(--admin-text-tertiary)' }}>
                  Products & Pricing
                </p>
              </div>
            </div>
            
            {/* User & Actions */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--admin-text-primary)' }}>
                  {user.name}
                </p>
                <p style={{ fontSize: '0.75rem', color: 'var(--admin-text-tertiary)' }}>
                  {user.email}
                </p>
              </div>
              <button
                onClick={async () => {
                  await fetch("/api/admin/logout", { method: "POST" });
                  window.location.href = `/${locale}/admin/login`;
                }}
                style={{
                  width: '40px',
                  height: '40px',
                  borderRadius: '10px',
                  border: '1px solid var(--admin-border)',
                  background: 'transparent',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--admin-text-tertiary)',
                  cursor: 'pointer',
                  transition: 'var(--admin-transition-fast)',
                }}
                title="Sign out"
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = 'var(--admin-gold-border)';
                  e.currentTarget.style.color = 'var(--admin-gold)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = 'var(--admin-border)';
                  e.currentTarget.style.color = 'var(--admin-text-tertiary)';
                }}
              >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4"/>
                  <polyline points="16,17 21,12 16,7"/>
                  <line x1="21" y1="12" x2="9" y2="12"/>
                </svg>
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div style={{
        background: 'var(--admin-bg-card)',
        borderBottom: '1px solid var(--admin-border-light)',
        position: 'sticky',
        top: '72px',
        zIndex: 40,
      }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto', padding: '0 1.5rem' }}>
          <nav style={{ display: 'flex', gap: '0.5rem', marginBottom: '-1px' }}>
            <TabButton
              active={activeTab === "products"}
              onClick={() => setActiveTab("products")}
              icon={
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                  <circle cx="8.5" cy="8.5" r="1.5"/>
                  <polyline points="21,15 16,10 5,21"/>
                </svg>
              }
            >
              User Products
            </TabButton>
            <TabButton
              active={activeTab === "calculator"}
              onClick={() => setActiveTab("calculator")}
              icon={
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                  <rect x="4" y="2" width="16" height="20" rx="2" ry="2"/>
                  <line x1="8" y1="6" x2="16" y2="6"/>
                  <line x1="8" y1="10" x2="10" y2="10"/>
                  <line x1="12" y1="10" x2="14" y2="10"/>
                  <line x1="8" y1="14" x2="10" y2="14"/>
                  <line x1="12" y1="14" x2="14" y2="14"/>
                  <line x1="8" y1="18" x2="10" y2="18"/>
                  <line x1="12" y1="18" x2="16" y2="18"/>
                </svg>
              }
            >
              Pricing Calculator
            </TabButton>
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main style={{ maxWidth: '1400px', margin: '0 auto', padding: '2rem 1.5rem' }}>
        {activeTab === "products" ? (
          <ProductsPanel />
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: '1.5rem' }}>
            {/* Left Sidebar - Calculator & Market Data */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <LiveCalculator
                input={input}
                onChange={handleInputChange}
                onCalculate={handleCalculate}
                isCalculating={isCalculating}
              />
              
              <MarketDataCard />
            </div>

            {/* Main Area - Pipeline & Details */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              {/* Visual Pipeline */}
              <PricingPipeline
                breakdown={breakdown}
                activeStage={activeStage}
                onStageClick={setActiveStage}
                isCalculating={isCalculating}
              />
              
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
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="#B91C1C" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    <circle cx="12" cy="12" r="10"/>
                    <line x1="12" y1="8" x2="12" y2="12"/>
                    <line x1="12" y1="16" x2="12.01" y2="16"/>
                  </svg>
                  <p style={{ fontSize: '0.875rem', color: '#B91C1C' }}>{error}</p>
                </div>
              )}
              
              {/* Stage Details */}
              <StageDetails
                breakdown={breakdown}
                input={input}
                activeStage={activeStage}
                onStageChange={setActiveStage}
              />
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

// Tab Button Component
function TabButton({ 
  active, 
  onClick, 
  children, 
  icon 
}: { 
  active: boolean; 
  onClick: () => void; 
  children: React.ReactNode;
  icon: React.ReactNode;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.875rem 1.25rem',
        fontSize: '0.875rem',
        fontWeight: 500,
        fontFamily: 'var(--admin-font-body)',
        color: active ? 'var(--admin-gold)' : 'var(--admin-text-secondary)',
        background: 'transparent',
        border: 'none',
        borderBottom: `2px solid ${active ? 'var(--admin-gold)' : 'transparent'}`,
        cursor: 'pointer',
        transition: 'var(--admin-transition-fast)',
        marginBottom: '-1px',
      }}
      onMouseEnter={(e) => {
        if (!active) {
          e.currentTarget.style.color = 'var(--admin-text-primary)';
          e.currentTarget.style.borderBottomColor = 'var(--admin-border)';
        }
      }}
      onMouseLeave={(e) => {
        if (!active) {
          e.currentTarget.style.color = 'var(--admin-text-secondary)';
          e.currentTarget.style.borderBottomColor = 'transparent';
        }
      }}
    >
      {icon}
      {children}
    </button>
  );
}
