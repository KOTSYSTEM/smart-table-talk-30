import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import { 
  Store, 
  Users, 
  Bell, 
  Printer,
  CreditCard,
  Shield,
  Palette,
  Globe,
  ChevronRight,
  Save
} from 'lucide-react';

export default function Settings() {
  const settingsSections = [
    {
      icon: Store,
      title: 'Restaurant Profile',
      description: 'Manage your restaurant details, logo, and contact information',
      badge: null,
    },
    {
      icon: Users,
      title: 'Staff & Roles',
      description: 'Configure staff accounts, roles, and permissions',
      badge: '12 users',
    },
    {
      icon: Bell,
      title: 'Notifications',
      description: 'Set up order alerts, reminders, and customer notifications',
      badge: null,
    },
    {
      icon: Printer,
      title: 'Printers & Hardware',
      description: 'Configure receipt printers, KDS displays, and terminals',
      badge: '3 devices',
    },
    {
      icon: CreditCard,
      title: 'Payments',
      description: 'Set up payment methods, taxes, and service charges',
      badge: null,
    },
    {
      icon: Shield,
      title: 'Security',
      description: 'Manage passwords, access controls, and audit logs',
      badge: null,
    },
    {
      icon: Palette,
      title: 'Appearance',
      description: 'Customize themes, colors, and branding',
      badge: null,
    },
    {
      icon: Globe,
      title: 'Integrations',
      description: 'Connect with delivery platforms, accounting, and more',
      badge: '2 active',
    },
  ];

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-fade-in">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-display font-bold">Settings</h1>
        <p className="text-muted-foreground mt-1">
          Configure your restaurant management system
        </p>
      </div>

      {/* Quick Settings */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <h2 className="font-display font-semibold text-lg mb-4">Quick Settings</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Auto-print KOT</p>
              <p className="text-sm text-muted-foreground">Automatically print kitchen tickets for new orders</p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Sound Alerts</p>
              <p className="text-sm text-muted-foreground">Play sound for new orders and notifications</p>
            </div>
            <Switch defaultChecked />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Auto-accept Online Orders</p>
              <p className="text-sm text-muted-foreground">Automatically confirm online orders without manual approval</p>
            </div>
            <Switch />
          </div>
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Table Merge/Split</p>
              <p className="text-sm text-muted-foreground">Allow staff to merge or split tables</p>
            </div>
            <Switch defaultChecked />
          </div>
        </div>
      </div>

      {/* Settings Sections */}
      <div className="bg-card rounded-2xl border border-border overflow-hidden">
        <h2 className="font-display font-semibold text-lg p-6 pb-4">All Settings</h2>
        <div className="divide-y divide-border">
          {settingsSections.map((section) => (
            <button
              key={section.title}
              className="w-full flex items-center gap-4 p-4 hover:bg-secondary/50 transition-colors text-left"
            >
              <div className="p-3 rounded-xl bg-secondary">
                <section.icon className="w-5 h-5 text-primary" />
              </div>
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <p className="font-medium">{section.title}</p>
                  {section.badge && (
                    <Badge variant="secondary">{section.badge}</Badge>
                  )}
                </div>
                <p className="text-sm text-muted-foreground">{section.description}</p>
              </div>
              <ChevronRight className="w-5 h-5 text-muted-foreground" />
            </button>
          ))}
        </div>
      </div>

      {/* Tax Settings */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <h2 className="font-display font-semibold text-lg mb-4">Tax Configuration</h2>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="text-sm font-medium text-muted-foreground">Tax Name</label>
            <Input defaultValue="GST" className="mt-1" />
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">Tax Rate (%)</label>
            <Input defaultValue="10" type="number" className="mt-1" />
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">Service Charge (%)</label>
            <Input defaultValue="5" type="number" className="mt-1" />
          </div>
          <div>
            <label className="text-sm font-medium text-muted-foreground">GST Number</label>
            <Input defaultValue="22AAAAA0000A1Z5" className="mt-1" />
          </div>
        </div>
        <Button className="mt-4">
          <Save className="w-4 h-4 mr-2" /> Save Changes
        </Button>
      </div>

      {/* Outlet Info */}
      <div className="bg-card rounded-2xl border border-border p-6">
        <h2 className="font-display font-semibold text-lg mb-4">Current Outlet</h2>
        <div className="flex items-center gap-4 p-4 bg-secondary/50 rounded-xl">
          <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center">
            <Store className="w-8 h-8 text-primary-foreground" />
          </div>
          <div className="flex-1">
            <h3 className="font-bold text-lg">Downtown Restaurant</h3>
            <p className="text-sm text-muted-foreground">123 Main Street, Downtown</p>
            <div className="flex gap-2 mt-2">
              <Badge variant="success">Active</Badge>
              <Badge variant="secondary">Primary Outlet</Badge>
            </div>
          </div>
          <Button variant="secondary">Switch Outlet</Button>
        </div>
      </div>
    </div>
  );
}
