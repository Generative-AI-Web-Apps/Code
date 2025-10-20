"use client";

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";

export default function ChuckNorrisFactCard({ fact }) {
  return (
    <Card className="my-2 border-blue-200 border">
      <CardHeader>
        <CardTitle>Chuck Norris Fact</CardTitle>
      </CardHeader>
      <CardContent>
        <CardDescription>{fact}</CardDescription>
      </CardContent>
    </Card>
  );
}
