import {
    Table,
    TableHead,
    TableRow,
    TableHeaderCell,
    TableBody,
    TableCell,
    Text
} from '@tremor/react';

export default function PRList(data: any, isLoading: String, onMerge: Function) {
    return (
        <Table>
            <TableHead>
                <TableRow>
                    <TableHeaderCell>Name</TableHeaderCell>
                    <TableHeaderCell>Username</TableHeaderCell>
                    <TableHeaderCell>Email</TableHeaderCell>
                </TableRow>
            </TableHead>
            <TableBody>

            </TableBody>
        </Table>
    );
}
