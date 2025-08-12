import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Users, 
  Settings, 
  FileText, 
  ArrowRight,
  Database,
  Activity,
  Download,
  Bolt,
  CheckCircle,
  AlertTriangle,
  Server,
  HardDrive
} from "lucide-react";

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState("overview");

  const { data: healthCheck } = useQuery({
    queryKey: ['/api/health'],
    refetchInterval: 30000,
  });

  const { data: stats } = useQuery({
    queryKey: ['/api/dashboard/stats'],
  });

  const adminCards = [
    {
      title: "User Management",
      description: "Manage system users and permissions",
      icon: Users,
      color: "text-primary",
      bgColor: "bg-primary-light bg-opacity-10",
      count: "24",
      action: "Manage Users"
    },
    {
      title: "System Settings",
      description: "Configure scanning parameters and thresholds",
      icon: Settings,
      color: "text-secondary",
      bgColor: "bg-secondary-light bg-opacity-10",
      count: "3 pending",
      action: "Configure"
    },
    {
      title: "OMR Templates",
      description: "Manage scanning templates and formats",
      icon: FileText,
      color: "text-accent",
      bgColor: "bg-accent bg-opacity-10",
      count: "5",
      action: "Edit Templates"
    }
  ];

  const systemHealth = [
    {
      name: "Database Connection",
      status: healthCheck?.database === "connected" ? "healthy" : "error",
      statusText: healthCheck?.database === "connected" ? "Healthy" : "Disconnected"
    },
    {
      name: "OMR Processing Service",
      status: "healthy",
      statusText: "Running"
    },
    {
      name: "Storage Usage",
      status: "warning",
      statusText: "75% Used"
    }
  ];

  const auditLogs = [
    {
      timestamp: "2024-01-15 10:30:22",
      user: "admin@school.edu",
      action: "Updated OMR template configuration",
      status: "success"
    },
    {
      timestamp: "2024-01-15 09:15:11",
      user: "teacher@school.edu",
      action: "Processed batch OMR-2024-001",
      status: "success"
    },
    {
      timestamp: "2024-01-15 08:45:33",
      user: "admin@school.edu",
      action: "Database maintenance completed",
      status: "success"
    }
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="text-center lg:text-left">
        <h1 className="text-3xl font-medium text-text-primary mb-2">System Administration</h1>
        <p className="text-text-secondary">Manage system settings, users, and OMR template configurations</p>
      </div>

      {/* Admin Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {adminCards.map((card) => {
          const Icon = card.icon;
          return (
            <Card 
              key={card.title}
              className="shadow-material-2 hover:shadow-material-4 transition-shadow cursor-pointer"
            >
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <div className={`w-12 h-12 ${card.bgColor} rounded-lg flex items-center justify-center`}>
                    <Icon className={`h-6 w-6 ${card.color}`} />
                  </div>
                  <span className="text-2xl font-bold text-primary">{card.count}</span>
                </div>
                <h3 className="text-lg font-medium text-text-primary mb-2">{card.title}</h3>
                <p className="text-text-secondary text-sm mb-4">{card.description}</p>
                <Button variant="outline" size="sm" className={`${card.color} hover:${card.color}`}>
                  {card.action} <ArrowRight className="h-4 w-4 ml-1" />
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* System Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <Card className="shadow-material-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5" />
              System Health
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {systemHealth.map((item, index) => (
              <div 
                key={index}
                className={`flex items-center justify-between p-3 rounded-lg ${
                  item.status === 'healthy' ? 'bg-green-50' : 
                  item.status === 'warning' ? 'bg-orange-50' : 'bg-red-50'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className={`w-2 h-2 rounded-full ${
                    item.status === 'healthy' ? 'bg-success' : 
                    item.status === 'warning' ? 'bg-accent' : 'bg-error'
                  }`} />
                  <span className="text-text-primary">{item.name}</span>
                </div>
                <span className={`text-sm font-medium ${
                  item.status === 'healthy' ? 'text-success' : 
                  item.status === 'warning' ? 'text-accent' : 'text-error'
                }`}>
                  {item.statusText}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>

        <Card className="shadow-material-2">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Database className="h-5 w-5" />
              Database Statistics
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-text-secondary">Total Records</span>
              <span className="text-text-primary font-medium">{stats?.totalSheets || 0}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-text-secondary">Storage Size</span>
              <span className="text-text-primary font-medium">2.3 GB</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-text-secondary">Backup Status</span>
              <span className="text-success font-medium">
                <CheckCircle className="h-4 w-4 inline mr-1" />
                Up to date
              </span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-text-secondary">Last Maintenance</span>
              <span className="text-text-primary font-medium">2 days ago</span>
            </div>
            <Separator />
            <Button className="w-full bg-primary hover:bg-primary-dark">
              <Bolt className="h-4 w-4 mr-2" />
              Run Maintenance
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* System Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="shadow-material-2">
          <CardContent className="p-6 text-center">
            <Server className="h-8 w-8 text-primary mx-auto mb-2" />
            <div className="text-2xl font-bold text-text-primary mb-1">99.9%</div>
            <div className="text-sm text-text-secondary">Uptime</div>
          </CardContent>
        </Card>

        <Card className="shadow-material-2">
          <CardContent className="p-6 text-center">
            <HardDrive className="h-8 w-8 text-accent mx-auto mb-2" />
            <div className="text-2xl font-bold text-text-primary mb-1">75%</div>
            <div className="text-sm text-text-secondary">Storage Used</div>
          </CardContent>
        </Card>

        <Card className="shadow-material-2">
          <CardContent className="p-6 text-center">
            <Activity className="h-8 w-8 text-success mx-auto mb-2" />
            <div className="text-2xl font-bold text-text-primary mb-1">{stats?.processingRate?.toFixed(1) || 0}%</div>
            <div className="text-sm text-text-secondary">Success Rate</div>
          </CardContent>
        </Card>

        <Card className="shadow-material-2">
          <CardContent className="p-6 text-center">
            <Users className="h-8 w-8 text-primary mx-auto mb-2" />
            <div className="text-2xl font-bold text-text-primary mb-1">24</div>
            <div className="text-sm text-text-secondary">Active Users</div>
          </CardContent>
        </Card>
      </div>

      {/* Audit Log */}
      <Card className="shadow-material-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <FileText className="h-5 w-5" />
              Recent Activity Log
            </CardTitle>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-1" />
              Export Log
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-medium text-text-secondary">Time</th>
                  <th className="text-left py-3 px-4 font-medium text-text-secondary">User</th>
                  <th className="text-left py-3 px-4 font-medium text-text-secondary">Action</th>
                  <th className="text-left py-3 px-4 font-medium text-text-secondary">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {auditLogs.map((log, index) => (
                  <tr key={index} className="hover:bg-gray-50">
                    <td className="py-3 px-4 text-sm text-text-secondary">{log.timestamp}</td>
                    <td className="py-3 px-4 text-sm text-text-primary">{log.user}</td>
                    <td className="py-3 px-4 text-sm text-text-primary">{log.action}</td>
                    <td className="py-3 px-4">
                      <Badge className="bg-success text-white">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Success
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
