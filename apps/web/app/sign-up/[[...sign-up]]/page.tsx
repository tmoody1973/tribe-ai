import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <main className="min-h-screen flex items-center justify-center p-8">
      <SignUp
        appearance={{
          elements: {
            rootBox: "mx-auto",
            card: "border-2 border-black shadow-brutal bg-white",
            headerTitle: "font-head text-2xl",
            headerSubtitle: "text-muted-foreground",
            socialButtonsBlockButton:
              "border-2 border-black shadow-brutal hover:shadow-none hover:translate-y-1 transition-all",
            formButtonPrimary:
              "bg-primary border-2 border-black shadow-brutal hover:shadow-none hover:translate-y-1 transition-all text-primary-foreground",
            formFieldInput:
              "border-2 border-black focus:ring-2 focus:ring-primary",
            footerActionLink: "text-primary hover:text-primary/80",
          },
        }}
      />
    </main>
  );
}
