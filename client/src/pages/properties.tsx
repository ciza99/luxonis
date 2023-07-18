import { useState } from "react";
import { useQuery } from "react-query";
import { API_URL } from "../constants";
import { Pagination } from "../components/pagination";

type Image = {
  url: string;
};
type Property = {
  id: number;
  title: string;
  price: string;
  images: Image[];
};

const fetchProperties = (page: number): Promise<Property[]> =>
  fetch(`${API_URL}/properties?page=${page}`).then((res) => res.json());

export const Properties = () => {
  const [page, setPage] = useState(1);
  const { data: properties } = useQuery({
    queryKey: ["properties", page],
    queryFn: () => fetchProperties(page),
  });

  return (
    <main className="container mx-auto p-4">
      <h1 className="font-bold text-blue-400 text-3xl mb-4">
        Properties for sale:
      </h1>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
        {properties?.map((property) => (
          <Property key={property.id} property={property} />
        ))}
      </div>

      <div className="mx-auto w-min mt-4">
        <Pagination page={page} onClick={setPage} totalPages={10} />
      </div>
    </main>
  );
};

const Property = ({ property }: { property: Property }) => {
  return (
    <div className="grow rounded-xl shadow-md overflow-hidden hover:scale-[1.0175] hover:shadow-xl transition-all">
      <img className="w-full object-contain" src={property.images[0].url} />
      <div className="p-2">
        <h2 className="text-blue-500 font-bold">{property.title}</h2>
        <p>Price: {property.price}</p>
      </div>
    </div>
  );
};
