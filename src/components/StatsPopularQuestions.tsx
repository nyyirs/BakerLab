import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
  } from "@/components/ui/table"
  import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
  
  const popularQuestions = [
    {
      question: "Payment issue for overtime hours",
      count: 4,
    },
    {
      question: "What are the different subscription plans?",
      count: 3,
    },
    {
      question: "How does TPE membership work?",
      count: 1,
    },
    {
      question: "Can overtime hours be refused?",
      count: 1,
    },
    {
      question: "Information request about main service categories",
      count: 1,
    },
  ]
  
  export default function PopularQuestions() {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Most Popular Questions</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead className="w-[80%]">Question</TableHead>
                <TableHead className="text-right">Count</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {popularQuestions.map((item) => (
                <TableRow key={item.question}>
                  <TableCell>{item.question}</TableCell>
                  <TableCell className="text-right">{item.count}</TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    )
  }
  
  