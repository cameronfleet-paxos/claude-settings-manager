"use client";

import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useUpdateStatus } from "@/lib/use-update-status";
import { RefreshCw, ExternalLink, Copy, Check } from "lucide-react";
import { useState } from "react";

const INSTALL_COMMAND =
  "curl -fsSL https://raw.githubusercontent.com/cameronfleet-paxos/claude-settings-manager/main/install.sh | bash";

export default function UpdatesPage() {
  const { status, version, checkForUpdates, hasUpdate } = useUpdateStatus();
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(INSTALL_COMMAND);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback: select the text
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">App Settings</h1>
        <p className="text-muted-foreground">
          Version information and updates
        </p>
      </div>

      {/* Current Version */}
      <Card>
        <CardHeader>
          <CardTitle>Current Version</CardTitle>
          <CardDescription>
            The version of Claude Settings you are running
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-3xl font-mono font-bold">
            {version ? `v${version}` : "Loading..."}
          </p>
        </CardContent>
      </Card>

      {/* Update Status */}
      <Card>
        <CardHeader>
          <CardTitle>Updates</CardTitle>
          <CardDescription>
            Check for new versions of Claude Settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Button
              onClick={checkForUpdates}
              disabled={status.state === "checking"}
              variant="outline"
            >
              <RefreshCw
                className={`mr-2 h-4 w-4 ${status.state === "checking" ? "animate-spin" : ""}`}
              />
              {status.state === "checking"
                ? "Checking..."
                : "Check for Updates"}
            </Button>

            {status.state === "up-to-date" && (
              <span className="text-sm text-green-500 font-medium">
                You&apos;re up to date!
              </span>
            )}

            {status.state === "error" && (
              <span className="text-sm text-red-500">
                Error: {status.message}
              </span>
            )}
          </div>

          {hasUpdate && status.state === "available" && (
            <div className="rounded-lg border border-orange-500/20 bg-orange-500/5 p-4 space-y-3">
              <p className="text-sm font-medium text-orange-500">
                Update available: v{status.version}
                {status.significantlyOutdated && (
                  <span className="ml-2 text-xs bg-orange-500/20 rounded px-2 py-0.5">
                    Significantly outdated
                  </span>
                )}
              </p>

              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">
                  To update, run:
                </p>
                <div className="flex items-center gap-2">
                  <code className="flex-1 rounded bg-muted px-3 py-2 text-xs font-mono break-all">
                    {INSTALL_COMMAND}
                  </code>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={handleCopy}
                    className="shrink-0"
                  >
                    {copied ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <Copy className="h-4 w-4" />
                    )}
                  </Button>
                </div>
              </div>

              <a
                href={status.releaseUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1 text-sm text-orange-500 hover:text-orange-400 transition-colors"
              >
                View release notes
                <ExternalLink className="h-3 w-3" />
              </a>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Install Command */}
      <Card>
        <CardHeader>
          <CardTitle>Install Command</CardTitle>
          <CardDescription>
            Use this command to install or reinstall Claude Settings
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center gap-2">
            <code className="flex-1 rounded bg-muted px-3 py-2 text-xs font-mono break-all">
              {INSTALL_COMMAND}
            </code>
            <Button
              variant="outline"
              size="sm"
              onClick={handleCopy}
              className="shrink-0"
            >
              {copied ? (
                <Check className="h-4 w-4" />
              ) : (
                <Copy className="h-4 w-4" />
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
