// /app/agents/page.tsx
import { AgentActions } from "../components/AgentAction";
import { auth } from "../auth";
import postgres from "postgres";
import { User } from "../lib/definitions";
import Link from "next/link";

const sql = postgres(process.env.POSTGRES_URL!, { ssl: 'require' });

export default async function Agents() {
  const session = await auth();

  if (!session?.user?.email) {
    return <p className="text-center text-red-500 mt-20">Vous devez être connecté pour accéder à cette page.</p>;
  }

  const users: User[] = await sql`SELECT * FROM users`;

  return (
    <div className="pt-24 flex flex-col gap-3 justify-center">
      <h1 className="text-4xl font-extrabold text-blue-900 text-center mb-10">
        Voici la liste de vos agents
      </h1>

       <Link className="text-xl text-center w-screen font-bold text-blue-600" href={`add-user/`} >
            Ajouter un nouveau agent
        </Link>
      <div className="px-4">
        <table className="min-w-full text-black">
          <thead className="bg-blue-600 text-white">
            <tr>
              <th className="px-6 py-4 text-center">Nom Agent</th>
              <th className="px-6 py-4 text-center">Adresse mail</th>
              <th className="px-6 py-4 text-center">Action</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
                !(user.name==='Ronel Mbami')
                && (<tr key={user.id} className="border-b hover:bg-gray-100">
                    <td className="px-6 py-4 font-medium text-center">{user.name}</td>
                    <td className="px-6 py-4 font-medium text-center">{user.email}</td>
                    <td className="px-6 py-4 font-medium flex justify-center">
                    <AgentActions
                    AgentId={user.id}
                    AgentName={user.name}
                    />
                    </td>
                </tr>) 
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
