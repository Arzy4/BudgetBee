import ExcelJS from 'exceljs'
import type { ApiTransaction } from '@/services/transactions/transactionService'
import { saveExportFile } from '@/utils/saveExportFile'
import type { ExportAction } from '@/utils/saveExportFile'

export async function exportTransactionsToExcel(
  transactions: ApiTransaction[],
  action: ExportAction = 'download',
): Promise<void> {
  const workbook = new ExcelJS.Workbook()

  workbook.creator = 'BudgetBee'
  workbook.created = new Date()

  const worksheet = workbook.addWorksheet('Financial Report', {
    views: [
      {
        state: 'normal',
        showGridLines: false,
      },
    ],
    properties: { defaultRowHeight: 20 },
  })

  // BudgetBee report colors
  const colors = {
    darkGreen: '234B3B',
    white: 'FFFFFF',
    amber: 'F9C74F',
    paleGreen: 'E6F4EA',
    paleRed: 'FDE8E7',
    paleYellow: 'FEF3C7',
    alternating: 'F1F5F2',
    darkText: '292524',
    mutedText: '64748B',
    income: '15803D',
    expense: 'DC2626',
  }

  // Column widths
  worksheet.columns = [
    { key: 'id', width: 10 },
    { key: 'date', width: 17 },
    { key: 'title', width: 28 },
    { key: 'description', width: 35 },
    { key: 'type', width: 16 },
    { key: 'category', width: 22 },
    { key: 'paymentMethod', width: 23 },
    { key: 'amount', width: 22 },
  ]
  
  const currencyFormat = '"Rp "#,##0;[Red]("Rp "#,##0)'

  const totalIncome = transactions
    .filter((transaction) => transaction.type === 'INCOME')
    .reduce((sum, transaction) => sum + Number(transaction.amount), 0)

  const totalExpenses = transactions
    .filter((transaction) => transaction.type === 'EXPENSE')
    .reduce((sum, transaction) => sum + Number(transaction.amount), 0)

  // Header
  worksheet.mergeCells('A1:H2')

  const titleCell = worksheet.getCell('A1')
  titleCell.value = 'BudgetBee'
  titleCell.font = {
    name: 'Aptos Display',
    size: 22,
    bold: true,
    color: { argb: colors.white },
  }
  titleCell.alignment = { vertical: 'middle', horizontal: 'left', indent: 1 }

  worksheet.mergeCells('A3:H3')
  const subtitleCell = worksheet.getCell('A3')
  subtitleCell.value = 'FINANCIAL TRANSACTION REPORT'
  subtitleCell.font = {
    name: 'Aptos',
    size: 11,
    bold: true,
    color: { argb: 'D1E7DA' },
  }
  subtitleCell.alignment = { indent: 2, vertical: 'middle' }

  worksheet.mergeCells('A4:H4')
  const periodCell = worksheet.getCell('A4')
  periodCell.value = `Generated: ${new Date().toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  })}`
  periodCell.font = {
    name: 'Aptos',
    size: 10,
    color: { argb: 'D1E7DA' },
  }
  periodCell.alignment = { indent: 2, vertical: 'middle' }

  for (let row = 1; row <= 4; row++) {
    for (let col = 1; col <= 8; col++) {
      worksheet.getCell(row, col).fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: { argb: colors.darkGreen },
      }
    }
  }

  worksheet.getRow(1).height = 24
  worksheet.getRow(2).height = 18
  worksheet.getRow(3).height = 23
  worksheet.getRow(4).height = 24
  worksheet.getRow(5).height = 12

  // Financial summary cards
  const summaries = [
    {
      label: 'TOTAL INCOME',
      value: totalIncome,
      range: ['A6:D6', 'A7:D8'],
      color: colors.paleGreen,
    },
    {
      label: 'TOTAL EXPENSES',
      value: totalExpenses,
      range: ['E6:H6', 'E7:H8'],
      color: colors.paleRed,
    },
  ]

  for (const summary of summaries) {
    worksheet.mergeCells(summary.range[0]!)
    worksheet.mergeCells(summary.range[1]!)

    const labelAddress = summary.range[0]!.split(':')[0]!
    const valueAddress = summary.range[1]!.split(':')[0]!

    const labelCell = worksheet.getCell(labelAddress)
    labelCell.value = summary.label
    labelCell.font = {
      name: 'Aptos',
      size: 10,
      bold: true,
      color: { argb: colors.mutedText },
    }
    labelCell.alignment = { vertical: 'middle', indent: 1 }

    const valueCell = worksheet.getCell(valueAddress)
    valueCell.value = summary.value
    valueCell.numFmt = currencyFormat
    valueCell.font = {
      name: 'Aptos',
      size: 16,
      bold: true,
      color: { argb: colors.darkText },
    }
    valueCell.alignment = { vertical: 'middle', indent: 1 }

    const [start, end] = summary.range[0]!.split(':')
    const startCol = Number(worksheet.getCell(start!).col)
    const endCol = Number(worksheet.getCell(end!).col)

    for (let row = 6; row <= 8; row++) {
      for (let col = startCol; col <= endCol; col++) {
        worksheet.getCell(row, col).fill = {
          type: 'pattern',
          pattern: 'solid',
          fgColor: { argb: summary.color },
        }
      }
    }
  }

  worksheet.getRow(6).height = 22
  worksheet.getRow(7).height = 24
  worksheet.getRow(8).height = 24
  worksheet.getRow(9).height = 14

  // Transaction table
  const headerRowNumber = 10
  const headers = [
    'ID',
    'Date',
    'Title',
    'Description',
    'Type',
    'Category',
    'Payment Method',
    'Amount (IDR)',
  ]

  const headerRow = worksheet.getRow(headerRowNumber)
  headerRow.values = headers
  headerRow.height = 30

  headerRow.eachCell((cell) => {
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: colors.amber },
    }
    cell.font = {
      name: 'Aptos',
      size: 11,
      bold: true,
      color: { argb: colors.darkText },
    }
    cell.alignment = {
      vertical: 'middle',
      horizontal: 'left',
      indent: 1,
    }
  })

  transactions.forEach((transaction, index) => {
    const row = worksheet.getRow(headerRowNumber + index + 1)

    row.values = [
      transaction.id,
      transaction.date.slice(0, 10),
      transaction.title,
      transaction.description ?? '',
      transaction.type,
      transaction.category.name,
      transaction.paymentMethod,
      Number(transaction.amount),
    ]

    row.height = 26

    row.eachCell({ includeEmpty: true }, (cell) => {
      cell.fill = {
        type: 'pattern',
        pattern: 'solid',
        fgColor: {
          argb: index % 2 === 0 ? colors.white : colors.alternating,
        },
      }

      cell.font = {
        name: 'Aptos',
        size: 10,
        color: { argb: colors.darkText },
      }

      cell.alignment = {
        vertical: 'middle',
        horizontal: 'left',
        indent: 1,
      }
    })

    const typeCell = row.getCell(5)
    typeCell.font = {
      name: 'Aptos',
      size: 10,
      bold: true,
      color: {
        argb: transaction.type === 'INCOME' ? colors.income : colors.expense,
      },
    }

    const amountCell = row.getCell(8)
    amountCell.numFmt = currencyFormat
    amountCell.alignment = {
      vertical: 'middle',
      horizontal: 'right',
      indent: 1,
    }
  })

  // Enable filtering and sorting
  worksheet.autoFilter = {
    from: { row: headerRowNumber, column: 1 },
    to: { row: headerRowNumber, column: 8 },
  }

  // Freeze the report header and column labels
  worksheet.views = [
    {
      state: 'normal',
      showGridLines: false,
    },
  ]

  // Generate Excel file
  const buffer = await workbook.xlsx.writeBuffer()

  const blob = new Blob([buffer as BlobPart], {
    type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  })

  await saveExportFile(
    blob,
    `budgetbee-financial-report-${new Date().toISOString().slice(0, 10)}.xlsx`,
    action,
  )
}
