// Sample data generators that create File objects for each tool

const SAMPLE_CSV = `id,name,email,age,city,salary,joined_date
1,Alice Johnson,alice@example.com,32,New York,85000,2021-03-15
2,Bob Smith,bob@example.com,28,San Francisco,92000,2022-01-10
3,Carol Williams,,45,Chicago,78000,2019-07-22
4,David Brown,david@example.com,35,Austin,95000,2020-11-03
5,Eve Davis,eve@example.com,29,Seattle,88000,2023-02-18
6,Frank Miller,frank@example.com,41,,72000,2018-09-01
7,Grace Lee,,38,Boston,91000,2021-06-14
8,Henry Wilson,henry@example.com,26,Denver,67000,2023-08-25
9,Iris Chen,iris@example.com,33,Portland,83000,2022-04-09
10,Jack Taylor,jack@example.com,47,Miami,105000,2017-01-30
11,Kate Anderson,kate@example.com,31,Austin,89000,2022-07-11
12,Liam Thomas,liam@example.com,29,New York,76000,2023-03-05
13,Mia Jackson,,36,Chicago,94000,2020-10-19
14,Noah White,noah@example.com,42,San Francisco,110000,2018-05-28
15,Olivia Harris,olivia@example.com,27,Seattle,,2023-11-12
16,Pete Martin,pete@example.com,39,Denver,87000,2019-12-07
17,Quinn Robinson,quinn@example.com,34,Boston,92000,2021-08-23
18,Rachel Clark,rachel@example.com,30,Portland,79000,2022-09-16
19,Sam Lewis,sam@example.com,44,Miami,98000,2018-02-14
20,Tina Walker,tina@example.com,28,Austin,71000,2023-06-30`;

const SAMPLE_CSV_MODIFIED = `id,name,email,age,city,salary,joined_date
1,Alice Johnson,alice@example.com,33,New York,90000,2021-03-15
2,Bob Smith,bob@example.com,28,San Francisco,92000,2022-01-10
3,Carol Williams,carol@example.com,45,Chicago,78000,2019-07-22
4,David Brown,david@example.com,35,Austin,95000,2020-11-03
5,Eve Davis,eve@example.com,29,Seattle,88000,2023-02-18
6,Frank Miller,frank@example.com,41,Houston,75000,2018-09-01
7,Grace Lee,,38,Boston,91000,2021-06-14
8,Henry Wilson,henry@example.com,26,Denver,67000,2023-08-25
9,Iris Chen,iris@example.com,33,Portland,83000,2022-04-09
10,Jack Taylor,jack@example.com,47,Miami,105000,2017-01-30
12,Liam Thomas,liam@example.com,29,New York,76000,2023-03-05
13,Mia Jackson,mia@example.com,36,Chicago,97000,2020-10-19
14,Noah White,noah@example.com,42,San Francisco,110000,2018-05-28
15,Olivia Harris,olivia@example.com,27,Seattle,82000,2023-11-12
16,Pete Martin,pete@example.com,39,Denver,87000,2019-12-07
17,Quinn Robinson,quinn@example.com,34,Boston,92000,2021-08-23
18,Rachel Clark,rachel@example.com,30,Portland,79000,2022-09-16
19,Sam Lewis,sam@example.com,44,Miami,98000,2018-02-14
20,Tina Walker,tina@example.com,28,Austin,71000,2023-06-30
21,Uma Patel,uma@example.com,31,Chicago,86000,2024-01-08
22,Victor Young,victor@example.com,37,Seattle,93000,2024-02-20`;

const SAMPLE_JSON = JSON.stringify([
  {
    id: 1,
    name: "Alice Johnson",
    contact: { email: "alice@example.com", phone: { home: "555-0101", work: "555-0102" } },
    address: { city: "New York", state: "NY", geo: { lat: 40.7128, lng: -74.006 } },
    tags: ["admin", "active"],
    orders: [
      { id: "ORD-001", total: 299.99, items: [{ sku: "A1", qty: 2 }, { sku: "B3", qty: 1 }] },
      { id: "ORD-002", total: 149.50, items: [{ sku: "C2", qty: 3 }] }
    ]
  },
  {
    id: 2,
    name: "Bob Smith",
    contact: { email: "bob@example.com", phone: { home: "555-0201", work: null } },
    address: { city: "San Francisco", state: "CA", geo: { lat: 37.7749, lng: -122.4194 } },
    tags: ["user"],
    orders: [
      { id: "ORD-003", total: 89.00, items: [{ sku: "D4", qty: 1 }] }
    ]
  },
  {
    id: 3,
    name: "Carol Williams",
    contact: { email: null, phone: { home: "555-0301", work: "555-0302" } },
    address: { city: "Chicago", state: "IL", geo: { lat: 41.8781, lng: -87.6298 } },
    tags: ["user", "premium"],
    orders: []
  }
], null, 2);

const SAMPLE_PROFILER_CSV = `id,name,email,age,city,salary,department,status,score,notes
1,Alice,alice@example.com,32,New York,85000,Engineering,active,92.5,
2,Bob,bob@example.com,28,San Francisco,92000,Engineering,active,88.0,Good performer
3,Carol,,45,Chicago,78000,Marketing,active,76.3,
4,David,david@example.com,35,Austin,95000,Engineering,active,95.1,Top performer
5,Eve,eve@example.com,29,Seattle,88000,Design,active,84.7,
6,Frank,frank@example.com,41,,72000,Marketing,inactive,71.2,On leave
7,Grace,,38,Boston,91000,Engineering,active,89.4,
8,Henry,henry@example.com,26,Denver,67000,Design,active,,New hire
9,Iris,iris@example.com,33,Portland,83000,Sales,active,82.1,
10,Jack,jack@example.com,47,Miami,105000,Engineering,active,93.8,Senior
11,Kate,kate@example.com,31,Austin,89000,Sales,active,79.5,
12,Liam,liam@example.com,29,New York,76000,Marketing,active,68.2,
13,Mia,,36,Chicago,94000,Engineering,active,91.0,
14,Noah,noah@example.com,42,San Francisco,110000,Engineering,active,96.2,Tech lead
15,Olivia,olivia@example.com,27,Seattle,,Design,active,73.8,
16,Pete,pete@example.com,39,Denver,87000,Sales,,85.4,
17,Quinn,quinn@example.com,34,Boston,92000,Engineering,active,87.9,
18,Rachel,,30,Portland,79000,Marketing,active,74.1,
19,Sam,sam@example.com,44,Miami,98000,Sales,active,90.3,
20,Tina,tina@example.com,28,Austin,71000,Design,active,,Probation`;

function stringToFile(content: string, filename: string, mimeType: string): File {
  return new File([content], filename, { type: mimeType });
}

export function getSampleCSV(): File {
  return stringToFile(SAMPLE_CSV, "employees.csv", "text/csv");
}

export function getSampleCSVBefore(): File {
  return stringToFile(SAMPLE_CSV, "employees_v1.csv", "text/csv");
}

export function getSampleCSVAfter(): File {
  return stringToFile(SAMPLE_CSV_MODIFIED, "employees_v2.csv", "text/csv");
}

export function getSampleJSON(): File {
  return stringToFile(SAMPLE_JSON, "customers.json", "application/json");
}

export function getSampleProfilerCSV(): File {
  return stringToFile(SAMPLE_PROFILER_CSV, "team_data.csv", "text/csv");
}

export function getSampleSchemaCSV(): File {
  return stringToFile(SAMPLE_CSV, "employees.csv", "text/csv");
}
