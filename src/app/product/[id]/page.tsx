import { Metadata } from "next";
import { notFound } from "next/navigation";
import { products, getProductImage, Product } from "@/lib/products";
import ProductDetailView from "@/components/product/ProductDetailView";

interface Props {
  params: Promise<{ id: string }>;
}

export async function generateStaticParams() {
  return products.map((product) => ({
    id: product.id,
  }));
}

function getProductSeo(product: Product) {
  const baseUrl = "https://www.larpsensestore.com";
  const image = `${baseUrl}${product.image || getProductImage(product.id, product.category)}`;
  const url = `${baseUrl}/product/${product.id}`;

  let title = `Buy ${product.name} Cheap | Instant Delivery - LarpSense`;
  let description = `Buy verified ${product.name} account from €${product.price.toFixed(2)}. Instant automated delivery, 6-hour warranty & secure client authentication.`;

  if (product.id === "prime") {
    title = "Buy Cheap CS2 Prime Status Account | Instant Delivery - LarpSense";
    description = "Buy verified cheap CS2 Prime Ready NFA account for only €0.79. Upgraded for Prime matchmaking right out of the box with instant automated delivery.";
  } else if (product.id === "premier") {
    title = "Buy CS2 Premier Ready Accounts Cheap | Instant Delivery - LarpSense";
    description = "Buy cheap CS2 Premier ready NFA accounts from €0.99. Calibrate your CS Rating immediately with zero cooldowns, instant delivery and 6h warranty.";
  } else if (product.id === "premier-inactive") {
    title = "Buy CS2 Premier Inactive Account (14d+) Cheap | LarpSense";
    description = "Buy dormant CS2 Premier NFA account with 14+ days of complete inactivity. Maximum longevity, low recovery risk, and instant automated delivery.";
  } else if (product.id.includes("medals")) {
    title = `Buy CS2 ${product.name} Cheap | Veteran Account - LarpSense`;
    description = `Buy verified CS2 Premier NFA accounts loaded with service medals. Show off your veteran status with instant automated delivery.`;
  } else if (product.id.includes("rating") || product.id.startsWith("premier-10k") || product.id.startsWith("premier-15k") || product.id.startsWith("premier-20k")) {
    title = `Buy CS2 ${product.name} Account Cheap | Instant Delivery - LarpSense`;
    description = `High-tier CS2 Premier rating calibrated account. Guaranteed Elo rating, instant automated credentials delivery & 6h warranty.`;
  } else if (product.id === "premier-rare") {
    title = "Buy CS2 Knife & Glove NFA Account Cheap | Rare Inventory - LarpSense";
    description = "Premium CS2 NFA account guaranteed with knife or gloves. Rare inventory, instant automated delivery & 6-hour warranty.";
  } else if (product.category === "rust") {
    title = `Buy Cheap Rust NFA Account (${product.name}) | LarpSense`;
    description = `Buy verified Rust NFA account with ${product.name} playtime. Instant credentials delivery and automated replacement warranty.`;
  }

  return { title, description, image, url };
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const product = products.find((p) => p.id === id);

  if (!product) {
    return {
      title: "Product Not Found | LarpSense Store",
      description: "The requested gaming account product was not found.",
    };
  }

  const { title, description, image, url } = getProductSeo(product);

  return {
    title,
    description,
    alternates: {
      canonical: url,
    },
    openGraph: {
      title,
      description,
      url,
      siteName: "LarpSense Store",
      images: [
        {
          url: image,
          width: 800,
          height: 600,
          alt: `${product.name} - LarpSense Store`,
        },
      ],
      locale: "en_US",
      type: "website",
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [image],
    },
  };
}

export default async function ProductPage({ params }: Props) {
  const { id } = await params;
  const product = products.find((p) => p.id === id);

  if (!product) {
    notFound();
  }

  const { title, description, image, url } = getProductSeo(product);

  // Sanitized JSON-LD Schema: ONLY public fields, NEVER leak cost or supplier information
  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    "name": product.name,
    "description": description,
    "image": image,
    "category": "Video Game Software",
    "brand": {
      "@type": "Brand",
      "name": "LarpSense Store",
    },
    "offers": {
      "@type": "Offer",
      "price": product.price.toFixed(2),
      "priceCurrency": "EUR",
      "priceValidUntil": "2027-12-31",
      "availability": "https://schema.org/InStock",
      "url": url,
      "seller": {
        "@type": "Organization",
        "name": "LarpSense Store",
      },
    },
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <ProductDetailView />
    </>
  );
}
