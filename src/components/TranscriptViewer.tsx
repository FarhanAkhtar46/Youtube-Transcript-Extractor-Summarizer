import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";
import { Download, Copy, FileJson, FileText, Film } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

interface Transcript {
  id: string;
  title: string;
  content: { text: string; start: number; duration: number }[];
  url: string;
}

interface TranscriptViewerProps {
  transcripts?: Transcript[];
  isLoading?: boolean;
}

const TranscriptViewer = ({
  transcripts = [],
  isLoading = false,
}: TranscriptViewerProps) => {
  const navigate = useNavigate();
  const [summary, setSummary] = useState("");
  const [activeTab, setActiveTab] = useState<string>(
    transcripts[0]?.id || "empty",
  );
  const [removeTimestamps, setRemoveTimestamps] = useState<boolean>(false);
  const [removeSpeakerLabels, setRemoveSpeakerLabels] =
    useState<boolean>(false);

  const displayTranscripts = transcripts;

  const getFilteredTranscript = (content: { text: string }[]): string => {
    let filteredContent = content.map(entry => entry.text).join("\n");

    if (removeTimestamps) {
      filteredContent = filteredContent.replace(
        /\[\d{2}:\d{2}:\d{2}\]\s?/g,
        "",
      );
    }

    if (removeSpeakerLabels) {
      filteredContent = filteredContent.replace(/Speaker \d+:\s?/g, "");
    }

    return filteredContent;
  };

  const copyToClipboard = (content: { text: string }[]) => {
    navigator.clipboard.writeText(getFilteredTranscript(content));
  };

  const downloadTranscript = (
    content: { text: string }[],
    title: string,
    format: string,
  ) => {
    const filteredContent = getFilteredTranscript(content);
    let downloadContent = filteredContent;
    let mimeType = "text/plain";
    let fileExtension = "txt";

    if (format === "json") {
      downloadContent = JSON.stringify(
        { title, transcript: filteredContent },
        null,
        2,
      );
      mimeType = "application/json";
      fileExtension = "json";
    } else if (format === "srt") {
      const lines = filteredContent.split("\n");
      downloadContent = lines
        .map((line, index) => {
          return `${index + 1}\n00:0${index}:00,000 --> 00:0${index + 1}:00,000\n${line}\n`;
        })
        .join("\n");
      fileExtension = "srt";
    }

    const blob = new Blob([downloadContent], { type: mimeType });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${title.replace(/\s+/g, "_")}.${fileExtension}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleSummarize = async (url) => {
    try {
      const response1 = await fetch('https://yt-backend.azurewebsites.net/summarize', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ url }),
      });

      if (!response1.ok) {
        throw new Error('Failed to summarize transcript');
      }

      const data = await response1.json();
      setSummary(data.summary);
    } catch (error) {
      console.error('Error summarizing transcript:', error);
    }
  };

  if (isLoading) {
    return (
      <div className="w-full h-96 flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading transcripts...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full bg-background rounded-lg border">
      <div className="p-4 border-b">
        <div className="flex justify-between items-center">
          <h2 className="text-xl font-semibold">Transcript Viewer</h2>
          <Button onClick={() => navigate("/")}>Home</Button>
        </div>
      </div>

      {displayTranscripts.length > 0 ? (
        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="border-b px-4">
            <TabsList className="bg-transparent h-12">
              {displayTranscripts.map((transcript) => (
                <TabsTrigger
                  key={transcript.id}
                  value={transcript.id}
                  className="data-[state=active]:bg-muted data-[state=active]:shadow-none rounded-none border-b-2 border-transparent data-[state=active]:border-primary"
                >
                  <div className="flex items-center">
                    <Film className="mr-2 h-4 w-4" />
                    <span className="truncate max-w-[150px]">
                      {transcript.title}
                    </span>
                  </div>
                </TabsTrigger>
              ))}
            </TabsList>
          </div>

          {displayTranscripts.map((transcript) => (
            <TabsContent
              key={transcript.id}
              value={transcript.id}
              className="p-0"
            >
              <Card className="border-0 shadow-none">
                <CardContent className="p-0">
                  <div className="flex justify-between items-center p-4 bg-muted/30">
                    <div>
                      <h3 className="font-medium">{transcript.title}</h3>
                      <a
                        href={transcript.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-sm text-blue-600 hover:underline"
                      >
                        {transcript.url}
                      </a>
                    </div>
                    <div className="flex space-x-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleSummarize(transcript.url)}
                      >
                        Summarize
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => copyToClipboard(transcript.content)}
                      >
                        <Copy className="h-4 w-4 mr-2" />
                        Copy
                      </Button>

                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="outline" size="sm">
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent>
                          <DropdownMenuItem
                            onClick={() =>
                              downloadTranscript(
                                transcript.content,
                                transcript.title,
                                "txt",
                              )
                            }
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            Download as TXT
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              downloadTranscript(
                                transcript.content,
                                transcript.title,
                                "srt",
                              )
                            }
                          >
                            <FileText className="h-4 w-4 mr-2" />
                            Download as SRT
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            onClick={() =>
                              downloadTranscript(
                                transcript.content,
                                transcript.title,
                                "json",
                              )
                            }
                          >
                            <FileJson className="h-4 w-4 mr-2" />
                            Download as JSON
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </div>
                  </div>

                  <Separator />

                  <ScrollArea className="h-[400px] p-4">
                    <pre className="whitespace-pre-wrap font-mono text-sm">
                      {getFilteredTranscript(transcript.content)}
                    </pre>
                    {summary && (
                      <div className="mt-4">
                        <h4 className="font-semibold">Summary:</h4>
                        <div className="bg-gray-100 p-4 rounded">
                          {summary.split('\n').map((line, index) => (
                            <p key={index} className="mb-2">{line}</p>
                          ))}
                        </div>
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </TabsContent>
          ))}
        </Tabs>
      ) : (
        <div className="flex flex-col items-center justify-center h-64 p-4">
          <p className="text-muted-foreground mb-2">No transcripts available</p>
          <p className="text-sm text-muted-foreground">
            Extract transcripts from YouTube videos to view them here
          </p>
        </div>
      )}
    </div>
  );
};

export default TranscriptViewer;