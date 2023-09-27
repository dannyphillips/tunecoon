"use client"

// import Search from './search';
import { mergePR, getRepoData } from './my_repos/utils';
import { useEffect, useState } from 'react';

import PRGrid from './my_repos/grid'
import PRList from './my_repos/list'

export const dynamic = 'force-dynamic';

type repositoriesArray = []




export default function IndexPage({
  searchParams
}: {
  searchParams: { q: string };
}) {
  const search = searchParams.q ?? '';
  const [data, setData] = useState<repositoriesArray>([])
  const [isLoading, setLoading] = useState('');
  const onMerge = (id: string) => {
    setLoading(id);
    mergePR(id);
    setTimeout(() => setLoading(''), 500);
  }

  useEffect(() => {
    getRepoData()
      .then((data: any) => {
        console.log("DATA: ", data)
        setData(data.user.repositories.nodes)
        setLoading('')
      })
  }, [])
  // const { getDetailsProps, setOpen } = useDetails({closeOnOutsideClick: true, ref})
  return (
    <main className="p-4 md:p-10 mx-auto max-w-7xl flex justify-center">
      {
        data.length == 0 ?
          <div
            className="p-16 m-60 h-20 w-20 align-center animate-spin rounded-full border-4 border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"
            role="status">
            <span
              className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]"
            >Loading...</span
            >
          </div> :
          <div>
            <PRGrid data={data} isLoading={isLoading} onMerge={onMerge}/>
            <PRList data={data} isLoading={isLoading} onMerge={onMerge}/>
          </div>
      }
    </main>
  );
}
