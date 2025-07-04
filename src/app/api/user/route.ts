import { NextRequest, NextResponse } from 'next/server';
import { getUserById, updateUser } from '@/app/lib/action';

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const idParam = searchParams.get('id');
    
  if (!idParam) {
    return NextResponse.json({ message: 'ID requis' }, { status: 400 });
  }

  const id = parseInt(idParam);
  const user = await getUserById(id);

  if (!user) {
    return NextResponse.json({ message: 'Utilisateur non trouvé' }, { status: 404 });
  }

  return NextResponse.json(user, { status: 200 });
}

export async function PUT(req: NextRequest) {
  const body = await req.json();
  const id = parseInt(body.id);

  if (!id || !body.name || !body.email) {
    return NextResponse.json({ message: 'Champs requis manquants' }, { status: 400 });
  }

  const result = await updateUser(id, {
    name: body.name,
    email: body.email,
    password: body.password || undefined,
  });

  if (!result.success) {
    return NextResponse.json({ message: result.error }, { status: 500 });
  }

  return NextResponse.json({ message: result.message }, { status: 200 });
}

  