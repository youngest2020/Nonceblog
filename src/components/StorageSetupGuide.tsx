import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { 
  AlertTriangle, 
  CheckCircle, 
  Copy, 
  ExternalLink, 
  Database,
  Shield,
  Folder,
  Settings
} from "lucide-react";

const StorageSetupGuide = () => {
  const { toast } = useToast();
  const [copiedStep, setCopiedStep] = useState<number | null>(null);

  const copyToClipboard = (text: string, stepNumber: number) => {
    navigator.clipboard.writeText(text);
    setCopiedStep(stepNumber);
    setTimeout(() => setCopiedStep(null), 2000);
    toast({
      title: "Copied!",
      description: "SQL command copied to clipboard",
    });
  };

  const sqlCommands = {
    enableRLS: `-- Enable RLS on storage tables
ALTER TABLE storage.buckets ENABLE ROW LEVEL SECURITY;
ALTER TABLE storage.objects ENABLE ROW LEVEL SECURITY;`,
    
    createPolicies: `-- Create storage policies for blog-images bucket
CREATE POLICY "Allow authenticated users to create blog-images bucket"
ON storage.buckets FOR INSERT TO authenticated
WITH CHECK (id = 'blog-images');

CREATE POLICY "Allow authenticated users to view blog-images bucket"
ON storage.buckets FOR SELECT TO authenticated, anon
USING (id = 'blog-images');

CREATE POLICY "Allow authenticated users to upload to blog-images"
ON storage.objects FOR INSERT TO authenticated
WITH CHECK (bucket_id = 'blog-images');

CREATE POLICY "Allow public to view blog-images"
ON storage.objects FOR SELECT TO authenticated, anon
USING (bucket_id = 'blog-images');

CREATE POLICY "Allow authenticated users to delete from blog-images"
ON storage.objects FOR DELETE TO authenticated
USING (bucket_id = 'blog-images');`,

    createBucket: `-- Create the blog-images bucket
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES (
  'blog-images',
  'blog-images', 
  true,
  10485760,
  ARRAY['image/jpeg', 'image/jpg', 'image/png', 'image/gif', 'image/webp', 'image/svg+xml']
)
ON CONFLICT (id) DO NOTHING;`
  };

  return (
    <div className="space-y-6">
      <Alert>
        <AlertTriangle className="h-4 w-4" />
        <AlertDescription>
          <strong>Storage Setup Required:</strong> Your Supabase project needs proper storage configuration 
          to upload blog images. Follow the steps below to fix the RLS policy issue.
        </AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            Manual Storage Setup Guide
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-800 text-sm">
              <strong>Why this is needed:</strong> The error "new row violates row-level security policy" 
              means your Supabase project has RLS policies that prevent bucket creation from the application. 
              We need to set up proper storage policies in your Supabase dashboard.
            </p>
          </div>

          {/* Step 1: Access Supabase Dashboard */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="outline">Step 1</Badge>
              <h3 className="font-semibold">Access Supabase Dashboard</h3>
            </div>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>Go to <a href="https://supabase.com/dashboard" target="_blank" rel="noopener noreferrer" className="text-blue-600 hover:underline">supabase.com/dashboard</a></li>
              <li>Select your project</li>
              <li>Navigate to <strong>SQL Editor</strong> in the left sidebar</li>
            </ol>
          </div>

          {/* Step 2: Enable RLS */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="outline">Step 2</Badge>
              <h3 className="font-semibold flex items-center gap-2">
                <Shield className="h-4 w-4" />
                Enable Row Level Security
              </h3>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              Run this SQL command to enable RLS on storage tables:
            </p>
            <div className="bg-gray-900 text-gray-100 p-3 rounded-md text-sm font-mono relative">
              <pre className="whitespace-pre-wrap">{sqlCommands.enableRLS}</pre>
              <Button
                size="sm"
                variant="outline"
                className="absolute top-2 right-2 h-8 w-8 p-0"
                onClick={() => copyToClipboard(sqlCommands.enableRLS, 1)}
              >
                {copiedStep === 1 ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Step 3: Create Storage Policies */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="outline">Step 3</Badge>
              <h3 className="font-semibold flex items-center gap-2">
                <Settings className="h-4 w-4" />
                Create Storage Policies
              </h3>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              Run this SQL command to create the necessary storage policies:
            </p>
            <div className="bg-gray-900 text-gray-100 p-3 rounded-md text-sm font-mono relative max-h-64 overflow-y-auto">
              <pre className="whitespace-pre-wrap">{sqlCommands.createPolicies}</pre>
              <Button
                size="sm"
                variant="outline"
                className="absolute top-2 right-2 h-8 w-8 p-0"
                onClick={() => copyToClipboard(sqlCommands.createPolicies, 2)}
              >
                {copiedStep === 2 ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Step 4: Create Bucket */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="outline">Step 4</Badge>
              <h3 className="font-semibold flex items-center gap-2">
                <Folder className="h-4 w-4" />
                Create Blog Images Bucket
              </h3>
            </div>
            <p className="text-sm text-gray-600 mb-3">
              Run this SQL command to create the blog-images bucket:
            </p>
            <div className="bg-gray-900 text-gray-100 p-3 rounded-md text-sm font-mono relative">
              <pre className="whitespace-pre-wrap">{sqlCommands.createBucket}</pre>
              <Button
                size="sm"
                variant="outline"
                className="absolute top-2 right-2 h-8 w-8 p-0"
                onClick={() => copyToClipboard(sqlCommands.createBucket, 3)}
              >
                {copiedStep === 3 ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          {/* Step 5: Verify Setup */}
          <div className="border rounded-lg p-4">
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="outline">Step 5</Badge>
              <h3 className="font-semibold">Verify Setup</h3>
            </div>
            <ol className="list-decimal list-inside space-y-2 text-sm">
              <li>After running all SQL commands, refresh this page</li>
              <li>Click the "Full Diagnostic" button above to verify everything works</li>
              <li>Try uploading an image to test the setup</li>
            </ol>
          </div>

          {/* Alternative: Use Supabase Storage UI */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <h4 className="font-semibold text-yellow-800 mb-2">Alternative Method:</h4>
            <p className="text-yellow-700 text-sm mb-3">
              You can also create the bucket manually using the Supabase Storage UI:
            </p>
            <ol className="list-decimal list-inside space-y-1 text-sm text-yellow-700">
              <li>Go to <strong>Storage</strong> in your Supabase dashboard</li>
              <li>Click <strong>"New bucket"</strong></li>
              <li>Name it <code className="bg-yellow-200 px-1 rounded">blog-images</code></li>
              <li>Make it <strong>Public</strong></li>
              <li>Set file size limit to <strong>10MB</strong></li>
              <li>Add allowed MIME types: <code className="bg-yellow-200 px-1 rounded">image/*</code></li>
            </ol>
            <p className="text-yellow-700 text-sm mt-2">
              <strong>Note:</strong> You'll still need to run the RLS policy SQL commands (Steps 2-3) for proper permissions.
            </p>
          </div>

          <div className="flex gap-3">
            <Button asChild>
              <a 
                href="https://supabase.com/dashboard" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2"
              >
                <ExternalLink className="h-4 w-4" />
                Open Supabase Dashboard
              </a>
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default StorageSetupGuide;

export default StorageSetupGuide