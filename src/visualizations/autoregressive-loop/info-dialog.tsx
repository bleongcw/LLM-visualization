import { Info } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

type InfoDialogProps = {
  title: string
  children: React.ReactNode
}

export function InfoDialog({ title, children }: InfoDialogProps) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" size="icon" className="h-8 w-8 rounded-full">
          <Info className="h-4 w-4 text-accent" />
          <span className="sr-only">Open information for {title}</span>
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle className="text-primary">{title}</DialogTitle>
          <DialogDescription className="text-base leading-7 text-foreground">
            {children}
          </DialogDescription>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  )
}
