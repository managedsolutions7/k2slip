import { getCompanies } from "../actions/companies";
import CompaniesClient from "./CompaniesClient";

export default async function CompaniesPage() {
  const companies = await getCompanies();
  return <CompaniesClient initialCompanies={companies} />;
}
