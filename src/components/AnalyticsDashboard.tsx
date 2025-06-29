import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAnalytics } from "@/hooks/useAnalytics";
import { visitorTracker } from "@/lib/visitorTracking";
import { 
  Eye, 
  Users, 
  Heart, 
  Share, 
  MessageSquare, 
  TrendingUp, 
  BarChart3,
  Target,
  MousePointer,
  Activity,
  RefreshCw,
  Trash2
} from "lucide-react";

const AnalyticsDashboard = () => {
  const { 
    postAnalytics, 
    promotionAnalytics, 
    analyticsSummary, 
    promotionSummary, 
    loading,
    refetch
  } = useAnalytics();

  if (loading) {
    return (
      <Card>
        <CardContent className="p-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <p className="text-gray-600">Loading analytics...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  const formatNumber = (num: number) => {
    if (num >= 1000000) return (num / 1000000).toFixed(1) + 'M';
    if (num >= 1000) return (num / 1000).toFixed(1) + 'K';
    return num.toString();
  };

  const formatPercentage = (num: number) => {
    return num.toFixed(1) + '%';
  };

  const handleRefreshAnalytics = async () => {
    await refetch();
  };

  const handleClearVisitorSession = () => {
    visitorTracker.clearSession();
    window.location.reload();
  };

  return (
    <div className="space-y-6">
      {/* Debug Panel for Development */}
      {process.env.NODE_ENV === 'development' && (
        <Card className="border-orange-200 bg-orange-50">
          <CardHeader>
            <CardTitle className="text-orange-800 flex items-center gap-2">
              <BarChart3 className="h-5 w-5" />
              Analytics Debug Panel
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
              <div>
                <p><strong>Visitor ID:</strong> {visitorTracker.getVisitorId()}</p>
                <p><strong>Session:</strong> {visitorTracker.getSessionInfo()?.createdAt}</p>
                <p><strong>Viewed Posts:</strong> {visitorTracker.getSessionInfo()?.viewedPosts.size || 0}</p>
              </div>
              <div>
                <p><strong>Fingerprint:</strong> {visitorTracker.getVisitorFingerprint()}</p>
                <p><strong>Total Analytics Records:</strong> {postAnalytics.length}</p>
                <p><strong>Promotion Records:</strong> {promotionAnalytics.length}</p>
              </div>
            </div>
            <div className="flex gap-2">
              <Button size="sm" onClick={handleRefreshAnalytics} variant="outline">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh Analytics
              </Button>
              <Button size="sm" onClick={handleClearVisitorSession} variant="outline">
                <Trash2 className="h-4 w-4 mr-2" />
                Clear Visitor Session
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="posts">Post Analytics</TabsTrigger>
          <TabsTrigger value="promotions">Promotion Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Overall Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Views</p>
                    <p className="text-2xl font-bold">
                      {formatNumber(analyticsSummary?.total_views || 0)}
                    </p>
                  </div>
                  <Eye className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Unique Visitors</p>
                    <p className="text-2xl font-bold">
                      {formatNumber(analyticsSummary?.total_unique_views || 0)}
                    </p>
                  </div>
                  <Users className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Total Engagement</p>
                    <p className="text-2xl font-bold">
                      {formatNumber(
                        (analyticsSummary?.total_likes || 0) + 
                        (analyticsSummary?.total_shares || 0) + 
                        (analyticsSummary?.total_comments || 0)
                      )}
                    </p>
                  </div>
                  <Activity className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600">Avg Engagement Rate</p>
                    <p className="text-2xl font-bold">
                      {formatPercentage(analyticsSummary?.avg_engagement_rate || 0)}
                    </p>
                  </div>
                  <TrendingUp className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Promotion Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Promotion Performance</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">
                    {formatNumber(promotionSummary?.total_views || 0)}
                  </p>
                  <p className="text-sm text-gray-600">Total Views</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {formatNumber(promotionSummary?.total_clicks || 0)}
                  </p>
                  <p className="text-sm text-gray-600">Total Clicks</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-purple-600">
                    {formatPercentage(promotionSummary?.avg_click_through_rate || 0)}
                  </p>
                  <p className="text-sm text-gray-600">Avg CTR</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="posts" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Post Performance</span>
                <Badge variant="outline">{postAnalytics.length} unique posts</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {postAnalytics.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No post analytics available yet.</p>
                ) : (
                  postAnalytics.map((analytics) => (
                    <div key={analytics.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900 mb-2">
                            {(analytics as any).blog_posts?.title || 'Unknown Post'}
                          </h3>
                          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <Eye className="h-4 w-4" />
                              <span>{formatNumber(analytics.views)} views</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              <span>{formatNumber(analytics.unique_views)} unique</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Heart className="h-4 w-4" />
                              <span>{formatNumber(analytics.likes)} likes</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Share className="h-4 w-4" />
                              <span>{formatNumber(analytics.shares)} shares</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <MessageSquare className="h-4 w-4" />
                              <span>{formatNumber(analytics.comments_count)} comments</span>
                            </div>
                          </div>
                        </div>
                        <Badge variant="outline">
                          {formatPercentage(analytics.engagement_rate)} engagement
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-gray-500">
                        <div>Bounce Rate: {formatPercentage(analytics.bounce_rate)}</div>
                        <div>Avg Reading Time: {analytics.reading_time_avg}s</div>
                        <div>Last Viewed: {new Date(analytics.last_viewed).toLocaleDateString()}</div>
                        <div>
                          CTR: {analytics.views > 0 ? formatPercentage((analytics.likes + analytics.shares) / analytics.views * 100) : '0%'}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="promotions" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center justify-between">
                <span>Promotion Performance</span>
                <Badge variant="outline">{promotionAnalytics.length} unique promotions</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {promotionAnalytics.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No promotion analytics available yet.</p>
                ) : (
                  promotionAnalytics.map((analytics) => (
                    <div key={analytics.id} className="border rounded-lg p-4">
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex-1">
                          <h3 className="font-medium text-gray-900 mb-2">
                            {(analytics as any).promotions?.title || 'Unknown Promotion'}
                          </h3>
                          <p className="text-sm text-gray-600 mb-3">
                            {(analytics as any).promotions?.message}
                          </p>
                          <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                            <div className="flex items-center gap-1">
                              <Eye className="h-4 w-4" />
                              <span>{formatNumber(analytics.total_views)} views</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Users className="h-4 w-4" />
                              <span>{formatNumber(analytics.unique_views)} unique</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <MousePointer className="h-4 w-4" />
                              <span>{formatNumber(analytics.total_clicks)} clicks</span>
                            </div>
                            <div className="flex items-center gap-1">
                              <Target className="h-4 w-4" />
                              <span>{formatNumber(analytics.unique_clicks)} unique clicks</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <Badge variant="outline" className="mb-2">
                            {formatPercentage(analytics.click_through_rate)} CTR
                          </Badge>
                          <div className="text-xs text-gray-500">
                            Conversion: {formatPercentage(analytics.conversion_rate)}
                          </div>
                        </div>
                      </div>
                      
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs text-gray-500">
                        <div>Bounce Rate: {formatPercentage(analytics.bounce_rate)}</div>
                        <div>Avg Time to Click: {analytics.avg_time_to_click}s</div>
                        <div>
                          View Rate: {analytics.total_views > 0 ? formatPercentage(analytics.unique_views / analytics.total_views * 100) : '0%'}
                        </div>
                        <div>
                          Click Rate: {analytics.total_clicks > 0 ? formatPercentage(analytics.unique_clicks / analytics.total_clicks * 100) : '0%'}
                        </div>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnalyticsDashboard;