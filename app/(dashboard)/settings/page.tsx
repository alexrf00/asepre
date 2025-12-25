"use client"

import { useState } from "react"
import { toast } from "sonner"
import { Settings, Database, Bell, Shield, Activity, Download, Trash2, RefreshCw } from "lucide-react"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ProtectedRoute } from "@/components/layout/protected-route"
import { ConfirmDialog } from "@/components/common/confirm-dialog"
import { LoadingSpinner } from "@/components/common/loading-spinner"

// Mock audit logs for demo
const mockAuditLogs = [
  {
    id: 1,
    action: "USER_LOGIN",
    user: "john.doe@example.com",
    details: "Successful login",
    ip: "192.168.1.1",
    timestamp: new Date(Date.now() - 1000 * 60 * 5).toISOString(),
  },
  {
    id: 2,
    action: "ROLE_ASSIGNED",
    user: "admin@example.com",
    details: "Assigned ADMINISTRADOR_GENERAL to jane.smith@example.com",
    ip: "192.168.1.100",
    timestamp: new Date(Date.now() - 1000 * 60 * 30).toISOString(),
  },
  {
    id: 3,
    action: "USER_CREATED",
    user: "admin@example.com",
    details: "Created user bob.wilson@example.com",
    ip: "192.168.1.100",
    timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
  },
  {
    id: 4,
    action: "PASSWORD_RESET",
    user: "alice.johnson@example.com",
    details: "Password reset initiated",
    ip: "10.0.0.50",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 2).toISOString(),
  },
  {
    id: 5,
    action: "ROLE_MODIFIED",
    user: "superadmin@example.com",
    details: "Updated permissions for VIEWER role",
    ip: "192.168.1.1",
    timestamp: new Date(Date.now() - 1000 * 60 * 60 * 5).toISOString(),
  },
]

// Mock system metrics
const mockMetrics = {
  totalRequests: 45892,
  avgResponseTime: 127,
  errorRate: 0.3,
  activeConnections: 234,
  cacheHitRate: 94.5,
  dbQueries: 12456,
}

export default function SettingsPage() {
  const [isClearingCache, setIsClearingCache] = useState(false)
  const [isResetOpen, setIsResetOpen] = useState(false)
  const [isResetting, setIsResetting] = useState(false)

  // Settings state
  const [settings, setSettings] = useState({
    emailNotifications: true,
    securityAlerts: true,
    sessionTimeout: "30",
    maxLoginAttempts: "5",
    requireEmailVerification: true,
    enableAuditLogs: true,
  })

  const handleClearCache = async () => {
    setIsClearingCache(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 1500))
      toast.success("Cache cleared successfully")
    } catch {
      toast.error("Failed to clear cache")
    } finally {
      setIsClearingCache(false)
    }
  }

  const handleSystemReset = async () => {
    setIsResetting(true)
    try {
      await new Promise((resolve) => setTimeout(resolve, 2000))
      toast.success("System reset initiated")
      setIsResetOpen(false)
    } catch {
      toast.error("Failed to reset system")
    } finally {
      setIsResetting(false)
    }
  }

  const handleExportLogs = () => {
    toast.success("Audit logs exported")
  }

  return (
    <ProtectedRoute roles={["SUPERADMIN"]}>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
          <p className="text-muted-foreground">System configuration and administration</p>
        </div>

        <Tabs defaultValue="general" className="space-y-6">
          <TabsList>
            <TabsTrigger value="general" className="gap-2">
              <Settings className="h-4 w-4" />
              General
            </TabsTrigger>
            <TabsTrigger value="security" className="gap-2">
              <Shield className="h-4 w-4" />
              Security
            </TabsTrigger>
            <TabsTrigger value="notifications" className="gap-2">
              <Bell className="h-4 w-4" />
              Notifications
            </TabsTrigger>
            <TabsTrigger value="audit" className="gap-2">
              <Activity className="h-4 w-4" />
              Audit Logs
            </TabsTrigger>
            <TabsTrigger value="system" className="gap-2">
              <Database className="h-4 w-4" />
              System
            </TabsTrigger>
          </TabsList>

          {/* General Settings */}
          <TabsContent value="general" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>General Settings</CardTitle>
                <CardDescription>Configure general application settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <Label htmlFor="appName">Application Name</Label>
                  <Input id="appName" defaultValue="ASEPRE" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="apiUrl">API Base URL</Label>
                  <Input id="apiUrl" defaultValue="http://localhost:8080" />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="timezone">Default Timezone</Label>
                  <Select defaultValue="utc">
                    <SelectTrigger>
                      <SelectValue placeholder="Select timezone" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="utc">UTC</SelectItem>
                      <SelectItem value="est">Eastern Time (EST)</SelectItem>
                      <SelectItem value="pst">Pacific Time (PST)</SelectItem>
                      <SelectItem value="cet">Central European Time (CET)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <Button>Save Changes</Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Security Settings */}
          <TabsContent value="security" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Security Configuration</CardTitle>
                <CardDescription>Configure authentication and security settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Require Email Verification</Label>
                    <p className="text-sm text-muted-foreground">
                      New users must verify their email before accessing the system
                    </p>
                  </div>
                  <Switch
                    checked={settings.requireEmailVerification}
                    onCheckedChange={(checked) =>
                      setSettings((s) => ({
                        ...s,
                        requireEmailVerification: checked,
                      }))
                    }
                  />
                </div>

                <Separator />

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="sessionTimeout">Session Timeout (minutes)</Label>
                    <Select
                      value={settings.sessionTimeout}
                      onValueChange={(value) => setSettings((s) => ({ ...s, sessionTimeout: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="15">15 minutes</SelectItem>
                        <SelectItem value="30">30 minutes</SelectItem>
                        <SelectItem value="60">1 hour</SelectItem>
                        <SelectItem value="120">2 hours</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="maxLoginAttempts">Max Login Attempts</Label>
                    <Select
                      value={settings.maxLoginAttempts}
                      onValueChange={(value) => setSettings((s) => ({ ...s, maxLoginAttempts: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="3">3 attempts</SelectItem>
                        <SelectItem value="5">5 attempts</SelectItem>
                        <SelectItem value="10">10 attempts</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Enable Audit Logs</Label>
                    <p className="text-sm text-muted-foreground">Track all user actions and system events</p>
                  </div>
                  <Switch
                    checked={settings.enableAuditLogs}
                    onCheckedChange={(checked) => setSettings((s) => ({ ...s, enableAuditLogs: checked }))}
                  />
                </div>

                <Button>Save Security Settings</Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Notifications Settings */}
          <TabsContent value="notifications" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Notification Preferences</CardTitle>
                <CardDescription>Configure system notification settings</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Email Notifications</Label>
                    <p className="text-sm text-muted-foreground">Receive email notifications for important events</p>
                  </div>
                  <Switch
                    checked={settings.emailNotifications}
                    onCheckedChange={(checked) => setSettings((s) => ({ ...s, emailNotifications: checked }))}
                  />
                </div>

                <Separator />

                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label>Security Alerts</Label>
                    <p className="text-sm text-muted-foreground">
                      Get notified about suspicious login attempts and security events
                    </p>
                  </div>
                  <Switch
                    checked={settings.securityAlerts}
                    onCheckedChange={(checked) => setSettings((s) => ({ ...s, securityAlerts: checked }))}
                  />
                </div>

                <Button>Save Notification Settings</Button>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Audit Logs */}
          <TabsContent value="audit" className="space-y-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Audit Logs</CardTitle>
                  <CardDescription>Track all system activities and user actions</CardDescription>
                </div>
                <Button variant="outline" onClick={handleExportLogs}>
                  <Download className="mr-2 h-4 w-4" />
                  Export Logs
                </Button>
              </CardHeader>
              <CardContent>
                <div className="rounded-lg border border-border">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-border bg-muted/50">
                          <th className="px-4 py-3 text-left text-sm font-medium">Action</th>
                          <th className="px-4 py-3 text-left text-sm font-medium">User</th>
                          <th className="px-4 py-3 text-left text-sm font-medium">Details</th>
                          <th className="px-4 py-3 text-left text-sm font-medium">IP Address</th>
                          <th className="px-4 py-3 text-left text-sm font-medium">Timestamp</th>
                        </tr>
                      </thead>
                      <tbody>
                        {mockAuditLogs.map((log) => (
                          <tr key={log.id} className="border-b border-border last:border-0">
                            <td className="px-4 py-3">
                              <Badge variant="outline" className="text-xs">
                                {log.action}
                              </Badge>
                            </td>
                            <td className="px-4 py-3 text-sm">{log.user}</td>
                            <td className="px-4 py-3 text-sm text-muted-foreground">{log.details}</td>
                            <td className="px-4 py-3 text-sm font-mono">{log.ip}</td>
                            <td className="px-4 py-3 text-sm text-muted-foreground">
                              {new Date(log.timestamp).toLocaleString()}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* System Settings */}
          <TabsContent value="system" className="space-y-6">
            {/* System Metrics */}
            <Card>
              <CardHeader>
                <CardTitle>System Metrics</CardTitle>
                <CardDescription>Real-time system performance data</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  <div className="rounded-lg border border-border p-4">
                    <p className="text-sm text-muted-foreground">Total Requests</p>
                    <p className="text-2xl font-bold">{mockMetrics.totalRequests.toLocaleString()}</p>
                  </div>
                  <div className="rounded-lg border border-border p-4">
                    <p className="text-sm text-muted-foreground">Avg Response Time</p>
                    <p className="text-2xl font-bold">{mockMetrics.avgResponseTime}ms</p>
                  </div>
                  <div className="rounded-lg border border-border p-4">
                    <p className="text-sm text-muted-foreground">Error Rate</p>
                    <p className="text-2xl font-bold">{mockMetrics.errorRate}%</p>
                  </div>
                  <div className="rounded-lg border border-border p-4">
                    <p className="text-sm text-muted-foreground">Active Connections</p>
                    <p className="text-2xl font-bold">{mockMetrics.activeConnections}</p>
                  </div>
                  <div className="rounded-lg border border-border p-4">
                    <p className="text-sm text-muted-foreground">Cache Hit Rate</p>
                    <p className="text-2xl font-bold">{mockMetrics.cacheHitRate}%</p>
                  </div>
                  <div className="rounded-lg border border-border p-4">
                    <p className="text-sm text-muted-foreground">DB Queries</p>
                    <p className="text-2xl font-bold">{mockMetrics.dbQueries.toLocaleString()}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* System Actions */}
            <Card>
              <CardHeader>
                <CardTitle>System Actions</CardTitle>
                <CardDescription>Perform system maintenance operations</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between rounded-lg border border-border p-4">
                  <div>
                    <p className="font-medium">Clear System Cache</p>
                    <p className="text-sm text-muted-foreground">Clear all cached data to refresh the system</p>
                  </div>
                  <Button variant="outline" onClick={handleClearCache} disabled={isClearingCache}>
                    {isClearingCache ? (
                      <LoadingSpinner size="sm" className="mr-2" />
                    ) : (
                      <RefreshCw className="mr-2 h-4 w-4" />
                    )}
                    Clear Cache
                  </Button>
                </div>

                <div className="flex items-center justify-between rounded-lg border border-destructive/20 bg-destructive/5 p-4">
                  <div>
                    <p className="font-medium text-destructive">Reset System to Defaults</p>
                    <p className="text-sm text-muted-foreground">
                      This will reset all settings to their default values
                    </p>
                  </div>
                  <Button variant="destructive" onClick={() => setIsResetOpen(true)}>
                    <Trash2 className="mr-2 h-4 w-4" />
                    Reset System
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Reset Confirmation Dialog */}
        <ConfirmDialog
          open={isResetOpen}
          onOpenChange={setIsResetOpen}
          title="Reset System Settings"
          description="Are you sure you want to reset all system settings to their default values? This action cannot be undone."
          confirmText="Reset System"
          variant="destructive"
          onConfirm={handleSystemReset}
          isLoading={isResetting}
        />
      </div>
    </ProtectedRoute>
  )
}