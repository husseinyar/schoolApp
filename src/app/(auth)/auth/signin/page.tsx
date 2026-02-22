"use client"

import * as React from "react"
import { useForm } from "react-hook-form"
import { useTranslation } from "react-i18next"
import { zodResolver } from "@hookform/resolvers/zod"
import { z } from "zod"
import { signIn } from "next-auth/react"
import { useRouter } from "next/navigation"
import { useState } from "react"
import { Loader2 } from "lucide-react"

import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { cn } from "@/lib/utils"

const loginSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(1, { message: "Password is required" }),
})

type LoginValues = z.infer<typeof loginSchema>

export default function SignInPage() {
  const router = useRouter()
  const { t } = useTranslation("common")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginValues>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  })

  async function onSubmit(data: LoginValues) {
    setIsLoading(true)
    setError(null)

    try {
      const result = await signIn("credentials", {
        redirect: false,
        email: data.email,
        password: data.password,
      })

      if (result?.error) {
        setError(t("validation.email")) // Generic error for now or add specific key
        return
      }

      router.push("/")
      router.refresh()
    } catch (e) {
      setError("Something went wrong. Please try again.")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <Card className="w-full shadow-lg border-0 bg-white/90 dark:bg-zinc-900/90 backdrop-blur-sm">
      <CardHeader className="space-y-1 text-center">
        <CardTitle className="text-2xl font-bold tracking-tight">
          <span suppressHydrationWarning>{t("login.title")}</span>
        </CardTitle>
        <CardDescription>
          <span suppressHydrationWarning>{t("login.description")}</span>
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="email"><span suppressHydrationWarning>{t("login.email_label")}</span></Label>
            <Input
              id="email"
              type="email"
              placeholder="admin@example.com"
              disabled={isLoading}
              {...register("email")}
              className={cn(errors.email && "border-red-500 focus-visible:ring-red-500")}
            />
            {errors.email && (
              <p className="text-sm text-red-500">{t("validation.email")}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="password"><span suppressHydrationWarning>{t("login.password_label")}</span></Label>
            <Input
              id="password"
              type="password"
              disabled={isLoading}
              {...register("password")}
              className={cn(errors.password && "border-red-500 focus-visible:ring-red-500")}
            />
            {errors.password && (
              <p className="text-sm text-red-500">{t("validation.required")}</p>
            )}
          </div>
          
          {error && (
             <div className="bg-red-500/15 text-red-600 text-sm p-3 rounded-md">
               {error}
             </div>
          )}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? <span suppressHydrationWarning>{t("login.loading")}</span> : <span suppressHydrationWarning>{t("login.submit")}</span>}

          </Button>
        </form>
      </CardContent>
      <CardFooter className="flex justify-center text-sm text-muted-foreground">
        <span suppressHydrationWarning>{t("login.footer")}</span>
      </CardFooter>
    </Card>
  )
}
