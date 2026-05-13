import { useState } from "react"
import { ArrowLeft, ArrowRight } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

import { tutorialSteps } from "./info-copy"

export function TutorialDialog() {
  const [open, setOpen] = useState(() => !localStorage.getItem("arl-tutorial-seen"))
  const [index, setIndex] = useState(0)
  const step = tutorialSteps[index]

  function close() {
    localStorage.setItem("arl-tutorial-seen", "true")
    setOpen(false)
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent>
        <DialogHeader>
          <p className="text-sm font-semibold text-primary">
            {index + 1} / {tutorialSteps.length}
          </p>
          <DialogTitle className="text-primary">{step.title}</DialogTitle>
          <DialogDescription className="text-base leading-7 text-foreground">
            {step.body}
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="items-center sm:justify-between">
          <Button variant="ghost" onClick={close}>
            {index === tutorialSteps.length - 1 ? "Close" : "Skip tutorial"}
          </Button>
          <div className="flex gap-2">
            <Button
              variant="outline"
              disabled={index === 0}
              onClick={() => setIndex((current) => current - 1)}
            >
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Button>
            {index === tutorialSteps.length - 1 ? (
              <Button onClick={close}>Got it</Button>
            ) : (
              <Button onClick={() => setIndex((current) => current + 1)}>
                Next
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
