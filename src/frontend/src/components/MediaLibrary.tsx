import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Film, Link, Loader2, Plus, Trash2, Upload } from "lucide-react";
import { motion } from "motion/react";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { ExternalBlob } from "../backend";
import {
  useAddMediaItem,
  useDeleteMediaItem,
  useGetAllMediaItems,
} from "../hooks/useQueries";

export default function MediaLibrary() {
  const { data: mediaItems = [], isLoading } = useGetAllMediaItems();
  const { mutateAsync: addMedia, isPending: adding } = useAddMediaItem();
  const { mutateAsync: deleteMedia } = useDeleteMediaItem();

  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [mediaKind, setMediaKind] = useState<"externalUrl" | "uploadedFile">(
    "externalUrl",
  );
  const [urlValue, setUrlValue] = useState("");
  const [uploadProgress, setUploadProgress] = useState<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const resetForm = () => {
    setTitle("");
    setMediaKind("externalUrl");
    setUrlValue("");
    setSelectedFile(null);
    setUploadProgress(null);
  };

  const handleAdd = async () => {
    if (!title.trim()) {
      toast.error("Please enter a title");
      return;
    }
    try {
      if (mediaKind === "externalUrl") {
        if (!urlValue.trim()) {
          toast.error("Please enter a URL");
          return;
        }
        await addMedia({
          title: title.trim(),
          mediaType: { __kind__: "externalUrl", externalUrl: urlValue.trim() },
          metadata: null,
        });
      } else {
        if (!selectedFile) {
          toast.error("Please select a file");
          return;
        }
        const bytes = new Uint8Array(await selectedFile.arrayBuffer());
        const blob = ExternalBlob.fromBytes(bytes).withUploadProgress((pct) =>
          setUploadProgress(pct),
        );
        await addMedia({
          title: title.trim(),
          mediaType: { __kind__: "uploadedFile", uploadedFile: blob },
          metadata: null,
        });
      }
      toast.success("Media added!");
      setOpen(false);
      resetForm();
    } catch {
      toast.error("Failed to add media");
    }
  };

  const handleDelete = async (id: bigint) => {
    try {
      await deleteMedia(id);
      toast.success("Deleted");
    } catch {
      toast.error("Failed to delete");
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="font-display font-bold text-lg text-foreground">
            Media Library
          </h2>
          <p className="text-sm text-muted-foreground">
            {mediaItems.length} items
          </p>
        </div>
        <Dialog
          open={open}
          onOpenChange={(v) => {
            setOpen(v);
            if (!v) resetForm();
          }}
        >
          <DialogTrigger asChild>
            <Button
              data-ocid="media.add_button"
              className="bg-primary text-primary-foreground hover:bg-primary/90"
            >
              <Plus className="w-4 h-4 mr-2" /> Add Media
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-card border-border max-w-md">
            <DialogHeader>
              <DialogTitle className="font-display font-bold">
                Add Media Item
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-2">
              <div>
                <Label className="text-sm font-medium mb-1.5 block">
                  Title
                </Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Movie or video title…"
                  data-ocid="media.title_input"
                  className="bg-muted border-input"
                />
              </div>
              <div>
                <Label className="text-sm font-medium mb-1.5 block">
                  Media Type
                </Label>
                <Select
                  value={mediaKind}
                  onValueChange={(v) =>
                    setMediaKind(v as "externalUrl" | "uploadedFile")
                  }
                >
                  <SelectTrigger
                    className="bg-muted border-input"
                    data-ocid="media.select"
                  >
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border">
                    <SelectItem value="externalUrl">
                      <div className="flex items-center gap-2">
                        <Link className="w-3.5 h-3.5" />
                        External URL
                      </div>
                    </SelectItem>
                    <SelectItem value="uploadedFile">
                      <div className="flex items-center gap-2">
                        <Upload className="w-3.5 h-3.5" />
                        Upload File
                      </div>
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              {mediaKind === "externalUrl" ? (
                <div>
                  <Label className="text-sm font-medium mb-1.5 block">
                    URL
                  </Label>
                  <Input
                    value={urlValue}
                    onChange={(e) => setUrlValue(e.target.value)}
                    placeholder="https://youtube.com/watch?v=…"
                    data-ocid="media.url_input"
                    className="bg-muted border-input"
                  />
                </div>
              ) : (
                <div>
                  <Label className="text-sm font-medium mb-1.5 block">
                    File
                  </Label>
                  <button
                    type="button"
                    className="w-full border-2 border-dashed border-border rounded-lg p-6 text-center cursor-pointer hover:border-primary/50 transition-colors"
                    onClick={() => fileInputRef.current?.click()}
                    data-ocid="media.dropzone"
                  >
                    {selectedFile ? (
                      <p className="text-sm text-foreground">
                        {selectedFile.name}
                      </p>
                    ) : (
                      <>
                        <Upload className="w-6 h-6 text-muted-foreground mx-auto mb-2" />
                        <p className="text-sm text-muted-foreground">
                          Click to select a video file
                        </p>
                      </>
                    )}
                  </button>
                  <input
                    ref={fileInputRef}
                    type="file"
                    accept="video/*"
                    className="hidden"
                    onChange={(e) =>
                      setSelectedFile(e.target.files?.[0] ?? null)
                    }
                    data-ocid="media.upload_button"
                  />
                  {uploadProgress !== null && (
                    <div className="mt-2">
                      <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-primary transition-all"
                          style={{ width: `${uploadProgress}%` }}
                        />
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">
                        {uploadProgress}% uploaded
                      </p>
                    </div>
                  )}
                </div>
              )}
            </div>
            <DialogFooter>
              <Button
                variant="ghost"
                onClick={() => setOpen(false)}
                data-ocid="media.cancel_button"
              >
                Cancel
              </Button>
              <Button
                onClick={handleAdd}
                disabled={adding}
                data-ocid="media.submit_button"
                className="bg-primary text-primary-foreground hover:bg-primary/90"
              >
                {adding ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Adding…
                  </>
                ) : (
                  "Add Media"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {isLoading ? (
        <div
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4"
          data-ocid="media.loading_state"
        >
          {[1, 2, 3].map((i) => (
            <Skeleton key={i} className="h-28 rounded-xl" />
          ))}
        </div>
      ) : mediaItems.length === 0 ? (
        <div
          className="flex flex-col items-center justify-center h-48 text-center border border-dashed border-border rounded-xl"
          data-ocid="media.empty_state"
        >
          <Film className="w-8 h-8 text-muted-foreground/30 mb-3" />
          <p className="font-display font-semibold text-foreground mb-1">
            No media items
          </p>
          <p className="text-sm text-muted-foreground">
            Add your first video or URL to get started.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {mediaItems.map((item, i) => (
            <motion.div
              key={item.id.toString()}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              data-ocid={`media.item.${i + 1}`}
              className="group bg-card border border-border rounded-xl p-4 flex items-start justify-between gap-3 hover:border-primary/30 transition-colors"
            >
              <div className="flex items-start gap-3 min-w-0">
                <div className="w-8 h-8 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  {item.mediaType.__kind__ === "externalUrl" ? (
                    <Link className="w-4 h-4 text-primary" />
                  ) : (
                    <Film className="w-4 h-4 text-primary" />
                  )}
                </div>
                <div className="min-w-0">
                  <p className="font-medium text-sm text-foreground truncate">
                    {item.title}
                  </p>
                  <Badge variant="secondary" className="mt-1 text-xs h-5">
                    {item.mediaType.__kind__ === "externalUrl"
                      ? "URL"
                      : "Upload"}
                  </Badge>
                </div>
              </div>
              <button
                type="button"
                onClick={() => handleDelete(item.id)}
                data-ocid={`media.delete_button.${i + 1}`}
                className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg text-destructive hover:bg-destructive/10 transition-all flex-shrink-0"
                title="Delete"
              >
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
}
