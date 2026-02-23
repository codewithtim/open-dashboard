# Notion Database Schema Setup Guide

To connect the Open Dashboard to Notion, you need to create four separate inline databases on a single parent page. Ensure that the column names and property types match this schema *exactly*.

---

### 1. projects Database
This is your core database. Every other database will link back to this one.

| Column Name | Property Type | Options |
| :--- | :--- | :--- |
| **name** | Title | *N/A* |
| **type** | Select | `software`, `content`, `consulting` |
| **status** | Select | `active`, `archived` |

---

### 2. costs Database
Tracks all expenses related to your projects.

| Column Name | Property Type | Options |
| :--- | :--- | :--- |
| **name** | Title | *N/A (e.g., "vercel hosting")* |
| **amount** | Number | Format: `U.S. Dollar` |
| **project** | Relation | **Link to: projects Database** |

---

### 3. revenue Database
Tracks all income related to your projects.

| Column Name | Property Type | Options |
| :--- | :--- | :--- |
| **name** | Title | *N/A (e.g., "stripe payout")* |
| **amount** | Number | Format: `U.S. Dollar` |
| **project** | Relation | **Link to: projects Database** |

---

### 4. metrics Database
Tracks custom, non-monetary KPIs for individual projects (e.g., mrr, youtube subscribers).

| Column Name | Property Type | Options |
| :--- | :--- | :--- |
| **metric name** | Title | *N/A (e.g., "monthly active users")* |
| **value** | Number | Format: `Number` (Unformatted) |
| **project** | Relation | **Link to: projects Database** |

---

### Next Steps: Link the IDs
Once these four databases are created and configured:
1. Open up each database as a full page.
2. In the URL bar (`https://www.notion.so/workspace/1234567890abcdef1234567890abcdef?v=...`), copy the **32-character string** coming right before the `?v=`.
3. Paste that ID into your local repository's `.env.local` file corresponding to its DB name!
