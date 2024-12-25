import React from 'react'
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"


const ContactPage = () => {
  return (
    <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-2 xl:grid-cols-4">
    <div className="col-span-full">
        <div className="space-y-4">
          <div>
            <div className="max-w-2xl">
                <div className="mb-6">
                    <h2 className="text-2xl font-semibold">Contact Us</h2>
                    <p className="text-muted-foreground">Get in touch with the BakerLab team</p>
                </div>
                <form>
                    <div className="grid w-full items-center gap-4">
                    <div className="flex flex-col space-y-1.5">
                        <label htmlFor="name">Name</label>
                        <Input id="name" placeholder="Your name" />
                    </div>
                    <div className="flex flex-col space-y-1.5">
                        <label htmlFor="email">Email</label>
                        <Input id="email" placeholder="Your email" type="email" />
                    </div>
                    <div className="flex flex-col space-y-1.5">
                        <label htmlFor="message">Message</label>
                        <Textarea id="message" placeholder="Your message" />
                    </div>
                    </div>
                </form>
                <div className="mt-6">
                    <Button className="w-full bg-BakerLabButton">Send Message</Button>
                </div>
            </div>
          </div>
        </div>
    </div>
</div>
  )
}

export default ContactPage