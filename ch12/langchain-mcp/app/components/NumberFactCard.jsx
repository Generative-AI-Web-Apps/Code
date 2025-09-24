"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function NumberFactCard({ fact }) {
  return (
    <Card className="my-2 border-blue-200 border">
      <CardHeader>
        <CardTitle>Number Fact</CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription>{fact}</CardDescription>
      </CardContent>
    </Card>
  );
}
