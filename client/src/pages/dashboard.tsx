import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  TrendingUp, 
  FileCheck, 
  Star, 
  BarChart3, 
  RefreshCw,
  CheckCircle,
  AlertTriangle,
  Clock,
  Users
} from "lucide-react";

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useQuery({
    queryKey: ['/api/dashboard/stats'],
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  const { data: recentBatches } = useQuery({
    queryKey: ['/api/batches'],
  });

  if (statsLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  const processingRate = stats?.processingRate || 0;
  const averageScore = stats?.averageScore || 0;

  // Mock data for charts (in a real app, this would come from the API)
  const responseDistribution = [
    { rating: "Excellent (5)", percentage: 42, color: "bg-success" },
    { rating: "Good (4)", percentage: 31, color: "bg-primary" },
    { rating: "Average (3)", percentage: 18, color: "bg-accent" },
    { rating: "Below Average (2)", percentage: 7, color: "bg-orange-400" },
    { rating: "Poor (1)", percentage: 2, color: "bg-error" },
  ];

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-medium text-text-primary mb-2">Analytics Dashboard</h1>
          <p className="text-text-secondary">Comprehensive insights and reporting for feedback analysis</p>
        </div>
        <Button variant="outline" className="self-start lg:self-center">
          <RefreshCw className="h-4 w-4 mr-2" />
          Refresh Data
        </Button>
      </div>

      {/* Dashboard Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card className="shadow-material-2">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-text-primary">Processing Rate</h3>
              <TrendingUp className="h-6 w-6 text-success" />
            </div>
            <div className="text-3xl font-bold text-success mb-2">
              {processingRate.toFixed(1)}%
            </div>
            <p className="text-text-secondary text-sm">Successful scan rate this month</p>
            <div className="mt-4 w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-success h-2 rounded-full transition-all duration-500" 
                style={{ width: `${processingRate}%` }}
              />
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-material-2">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-text-primary">Average Response</h3>
              <Star className="h-6 w-6 text-accent" />
            </div>
            <div className="text-3xl font-bold text-primary mb-2">
              {averageScore.toFixed(1)}/5
            </div>
            <p className="text-text-secondary text-sm">Overall satisfaction rating</p>
            <div className="flex mt-3">
              {Array.from({ length: 5 }, (_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${
                    i + 1 <= Math.round(averageScore) 
                      ? 'text-yellow-400 fill-current' 
                      : 'text-gray-300'
                  }`}
                />
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-material-2">
          <CardContent className="p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-text-primary">Total Processed</h3>
              <FileCheck className="h-6 w-6 text-primary" />
            </div>
            <div className="text-3xl font-bold text-text-primary mb-2">
              {stats?.processedSheets || 0}
            </div>
            <p className="text-text-secondary text-sm">Sheets processed this semester</p>
            <div className="flex items-center mt-3 text-success text-sm">
              <TrendingUp className="h-4 w-4 mr-1" />
              <span>Active processing</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Feedback Trends Chart Placeholder */}
        <Card className="shadow-material-2">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Feedback Trends
              </CardTitle>
              <select className="text-sm border border-gray-300 rounded px-3 py-1 focus:ring-2 focus:ring-primary focus:border-primary">
                <option>Last 7 days</option>
                <option>Last 30 days</option>
                <option>Last 3 months</option>
              </select>
            </div>
          </CardHeader>
          <CardContent>
            <div className="h-64 bg-gray-50 rounded-lg flex items-center justify-center">
              <div className="text-center">
                <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <p className="text-text-secondary">Feedback trend visualization</p>
                <p className="text-sm text-text-secondary">Daily average ratings over time</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Response Distribution */}
        <Card className="shadow-material-2">
          <CardHeader>
            <CardTitle>Response Distribution</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {responseDistribution.map((item, index) => (
                <div key={index} className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`w-4 h-4 ${item.color} rounded`} />
                    <span className="text-text-primary">{item.rating}</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <span className="text-text-secondary text-sm">{item.percentage}%</span>
                    <div className="w-24 bg-gray-200 rounded-full h-2">
                      <div 
                        className={`${item.color} h-2 rounded-full transition-all duration-500`}
                        style={{ width: `${item.percentage}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="shadow-material-2">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Processing Activity
            </CardTitle>
            <Button variant="outline" size="sm">
              <RefreshCw className="h-4 w-4 mr-1" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {recentBatches?.slice(0, 5).map((batch: any) => (
              <div key={batch.id} className="flex items-center justify-between py-3 border-b border-gray-100 last:border-b-0">
                <div className="flex items-center gap-3">
                  <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    batch.status === 'completed' ? 'bg-success bg-opacity-10' : 
                    batch.status === 'failed' ? 'bg-error bg-opacity-10' : 
                    'bg-accent bg-opacity-10'
                  }`}>
                    {batch.status === 'completed' ? (
                      <CheckCircle className="h-5 w-5 text-success" />
                    ) : batch.status === 'failed' ? (
                      <AlertTriangle className="h-5 w-5 text-error" />
                    ) : (
                      <Clock className="h-5 w-5 text-accent" />
                    )}
                  </div>
                  <div>
                    <p className="text-text-primary font-medium">
                      Batch {batch.batchCode} {batch.status === 'completed' ? 'processed successfully' : 
                        batch.status === 'failed' ? 'failed processing' : 'is being processed'}
                    </p>
                    <p className="text-text-secondary text-sm">
                      {batch.totalSheets} sheets • {new Date(batch.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                <Button variant="outline" size="sm">
                  View Details
                </Button>
              </div>
            )) || (
              <div className="text-center py-8">
                <Users className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-text-secondary">No recent activity</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
