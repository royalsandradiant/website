import { fetchComboSettings, fetchAllHeroImages, fetchShippingRules } from '@/app/lib/data';
import ComboSettingsForm from './combo-settings-form';
import DeliverySettingsForm from './delivery-settings-form';
import ShippingRulesForm from './shipping-rules-form';
import HeroImagesForm from './hero-images-form';

export default async function SettingsPage() {
  const settings = await fetchComboSettings();
  const heroImages = await fetchAllHeroImages();
  const shippingRules = await fetchShippingRules();

  return (
    <div className="w-full pb-20">
      <h1 className="text-2xl mb-8">Settings</h1>
      
      <div className="space-y-12">
        {/* Delivery Settings */}
        <section className="rounded-lg bg-gray-50 p-6 border border-gray-200">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-blue-500/10 text-blue-600">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="1" y="3" width="15" height="13" />
                <polygon points="16 8 20 8 23 11 23 16 16 16 16 8" />
                <circle cx="5.5" cy="18.5" r="2.5" />
                <circle cx="18.5" cy="18.5" r="2.5" />
              </svg>
            </span>
            Delivery & Timeline
          </h2>
          <p className="text-sm text-gray-600 mb-6">
            Set the estimated delivery window displayed on product pages.
          </p>
          <DeliverySettingsForm 
            minDays={settings.estimatedDeliveryMin} 
            maxDays={settings.estimatedDeliveryMax} 
          />
        </section>

        {/* Shipping Rules */}
        <section className="rounded-lg bg-gray-50 p-6 border border-gray-200">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-green-500/10 text-green-600">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
              </svg>
            </span>
            Shipping Costs
          </h2>
          <p className="text-sm text-gray-600 mb-6">
            Configure shipping rates based on order total. (e.g. Free shipping over $100).
          </p>
          <ShippingRulesForm rules={shippingRules} />
        </section>

        {/* Hero Carousel Settings */}
        <section className="rounded-lg bg-gray-50 p-6 border border-gray-200">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-purple-500/10 text-purple-600">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                <circle cx="8.5" cy="8.5" r="1.5"/>
                <polyline points="21 15 16 10 5 21"/>
              </svg>
            </span>
            Homepage Hero Images
          </h2>
          <p className="text-sm text-gray-600 mb-6">
            Manage the images shown in the homepage carousel. Upload 3-4 images for the best effect.
          </p>
          <HeroImagesForm initialImages={heroImages} />
        </section>

        {/* Combo Settings */}
        <div className="rounded-lg bg-gray-50 p-6 border border-gray-200">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <span className="inline-flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary">
              <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/>
                <polyline points="3.27 6.96 12 12.01 20.73 6.96"/>
                <line x1="12" y1="22.08" x2="12" y2="12"/>
              </svg>
            </span>
            Combo Deal Settings
          </h2>
          <p className="text-sm text-gray-600 mb-6">
            Configure the discounts for combo deals. Customers can select 2 or 3 products marked for combo and receive a percentage discount.
          </p>
          
          <ComboSettingsForm currentDiscount2={settings.comboDiscount2} currentDiscount3={settings.comboDiscount3} />
        </div>
      </div>
    </div>
  );
}
