
"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { useDictionary } from "@/hooks/use-dictionary";
import { Vote, ShieldCheck, ArrowRight, BookUser, ShieldAlert, Globe } from "lucide-react";
import Image from "next/image";
import { placeholderImages } from "@/lib/placeholder-images";

const serviceCards = [
    {
        icon: Vote,
        title: "Igeragezwa ry'Itora",
        description: "Gira uruhare mu igeragezwa ry'amatora y'ikoranabuhanga. Hitamo umukandida w'ikitegererezo maze utange ijwi ryawe.",
        href: "/vote",
        buttonText: "Tangira Itora"
    },
    {
        icon: Globe,
        title: "Serivisi za Leta (Irembo)",
        description: "Saba serivisi zirenga 200 za Leta y'u Rwanda, nko gusaba indangamuntu, icyemezo cy'amavuko, n'ibindi, unyuze ku rubuga rwa Irembo.",
        href: "https://irembo.gov.rw/",
        buttonText: "Sura Irembo"
    },
    {
        icon: BookUser,
        title: "Amatora Nyayo (NEC)",
        description: "Besök den officiella webbplatsen för Rwandas nationella valkommission (NEC) för att verifiera din väljarstatus, se valresultat och få tillgång till officiell information.",
        href: "https://www.nec.gov.rw/",
        buttonText: "Besök NEC"
    },
     {
        icon: ShieldAlert,
        title: "Umutekano w'Amakuru",
        description: "Amakuru yawe bwite, nk'indangamuntu, ni ay'agaciro. Irinde abajura b'ikoranabuhanga; jya umenya neza ko uri ku rubuga rwemewe.",
        href: "https://www.nca.gov.rw/",
        buttonText: "Learn More"
    }
]

export default function DashboardPage() {
  const { dict } = useDictionary();
  const electionImage = placeholderImages.find(p => p.id === "election-banner");

  return (
    <div className="container mx-auto py-8 px-4">
      <div className="text-center mb-12">
        <h1 className="text-4xl font-bold font-headline mb-2 text-primary">
          {dict.dashboard.welcomeTitle}
        </h1>
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
          {dict.dashboard.welcomeSubtitle}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-2 gap-8">
        {serviceCards.map(card => (
            <Card key={card.title} className="flex flex-col shadow-lg hover:shadow-xl transition-shadow duration-300">
                <CardHeader className="flex-row items-start gap-4">
                    <div className="p-3 bg-primary/10 rounded-full">
                        <card.icon className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                        <CardTitle>{card.title}</CardTitle>
                        <CardDescription className="mt-1">{card.description}</CardDescription>
                    </div>
                </CardHeader>
                <CardContent className="flex-grow flex items-end">
                    <Link href={card.href} target={card.href.startsWith('http') ? '_blank' : '_self'} className="w-full">
                        <Button className="w-full" variant={card.href === "/vote" ? "default" : "secondary"}>
                            {card.buttonText} <ArrowRight className="ml-2 h-4 w-4" />
                        </Button>
                    </Link>
                </CardContent>
            </Card>
        ))}
      </div>
      
    </div>
  );
}
    

    