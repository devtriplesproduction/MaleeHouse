import { getEmployeeDocumentsAction } from "@/actions/storage.actions";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { FileText, Download } from "lucide-react";
import Link from "next/link";

export default async function EmployeeDetailsPage({ params }: { params: { id: string } }) {
  const { data: documents, success } = await getEmployeeDocumentsAction(params.id);

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Employee Details</h1>
          <p className="text-muted-foreground mt-1">Manage documents and profile information.</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Profile Summary</CardTitle>
            <CardDescription>Employee ID: {params.id}</CardDescription>
          </CardHeader>
          <CardContent>
             <p className="text-sm text-muted-foreground py-4 text-center">
               Profile information loaded from HR directory.
             </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Documents</CardTitle>
            <CardDescription>Contracts, certifications, and compliance files.</CardDescription>
          </CardHeader>
          <CardContent>
            {success && documents && documents.length > 0 ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Category</TableHead>
                    <TableHead>Uploaded By</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {documents.map((doc: any) => (
                    <TableRow key={doc.id}>
                      <TableCell className="font-medium capitalize flex items-center gap-2">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        {doc.category}
                      </TableCell>
                      <TableCell>{doc.uploaded_by_profile?.first_name} {doc.uploaded_by_profile?.last_name}</TableCell>
                      <TableCell>{new Date(doc.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <Link href={doc.file_url} target="_blank" className="text-blue-500 hover:underline flex items-center justify-end gap-1">
                          <Download className="h-3 w-3" /> View
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <div className="text-center text-muted-foreground py-8">No documents uploaded yet.</div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
