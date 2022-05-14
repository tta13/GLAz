import * as d3 from 'd3';
import { useEffect, useState } from 'react';
import TableBody from '../../components/sortable-table/body';
import TableHead from '../../components/sortable-table/head';
import Select from 'react-select';
import { Bar } from '@nivo/bar';

interface YoYData {
  language_name: string;
  year: number;
  count: number;
  lag_count?: number;
  change: number;
}

interface QoQData {
  language_name: string;
  year: number;
  quarter: number;
  count: number;
  lag_count?: number;
  change: number;
}

interface ChartData {
  language_name: string;
  change: number;
}

interface SortProps {
  sortField: string;
  sortOrder: 'asc' | 'desc';
}

const ChangeRanking = () => {
  const [tableData, setTableData] = useState<(YoYData | QoQData)[]>([]);
  const [data, setData] = useState<(YoYData | QoQData)[]>([]);
  const [year, setYear] = useState<number>(2012);
  const [quarter, setQuarter] = useState<number | null>(null);
  const [event, setEvent] = useState<string>('_commits.csv');
  const [top] = useState(10);
  const [sortActive, setSortActive] = useState<SortProps>({
    sortField: 'change',
    sortOrder: 'desc'
  });

  useEffect(() => updateTable(), []);
  useEffect(() => {
    updateTable();
  }, [year, quarter, event]);

  const updateTable = () => {
    if (quarter === null) updateYoYDataSource(`./data/yoy_change${event}`);
    else updateQoQDataSource(`./data/qoq_change${event}`);
  };

  const yearSelectOptions = [
    { value: 2012, label: '2012', color: '#000' },
    { value: 2013, label: '2013', color: '#000' },
    { value: 2014, label: '2014', color: '#000' },
    { value: 2015, label: '2015', color: '#000' },
    { value: 2016, label: '2016', color: '#000' },
    { value: 2017, label: '2017', color: '#000' },
    { value: 2018, label: '2018', color: '#000' },
    { value: 2019, label: '2019', color: '#000' },
    { value: 2020, label: '2020', color: '#000' },
    { value: 2021, label: '2021', color: '#000' },
    { value: 2022, label: '2022', color: '#000' }
  ];

  const quarterSelectOptions = [
    { value: 1, label: 'Q1' },
    { value: 2, label: 'Q2' },
    { value: 3, label: 'Q3' },
    { value: 4, label: 'Q4' }
  ];

  const datasetSelectOptions = [
    { value: '_commits.csv', label: 'Commits' },
    { value: '_prs.csv', label: 'Pull requests' },
    { value: '_repos.csv', label: 'Repos' }
  ];

  function updateYoYDataSource(path: string) {
    d3.csv(path).then((value: any[]) => {
      let newData = value.map((d: any) => {
        return {
          language_name: d.language_name,
          count: +d.count,
          change: +d.yoy_change,
          year: +d.year
        } as YoYData;
      });
      newData = newData.filter((d) => d.year == year);
      newData.sort((a, b) => {
        if ((a as any)[sortActive.sortField] === null) return 1;
        if ((b as any)[sortActive.sortField] === null) return -1;
        if ((a as any)[sortActive.sortField] === null && (b as any)[sortActive.sortField] === null)
          return 0;
        if (sortActive.sortOrder == 'asc')
          return (a as any)[sortActive.sortField] - (b as any)[sortActive.sortField];
        return (b as any)[sortActive.sortField] - (a as any)[sortActive.sortField];
      });
      setData(newData);
      setTableData(newData.slice(0, top));
    });
  }

  function updateQoQDataSource(path: string) {
    d3.csv(path).then((value: any[]) => {
      let newData = value.map((d: any) => {
        return {
          language_name: d.language_name,
          count: +d.count,
          change: +d.qoq_change,
          year: +d.year,
          quarter: +d.quarter
        } as QoQData;
      });
      newData = newData.filter((d) => d.year == year && d.quarter == quarter);
      newData.sort((a, b) => {
        if ((a as any)[sortActive.sortField] === null) return 1;
        if ((b as any)[sortActive.sortField] === null) return -1;
        if ((a as any)[sortActive.sortField] === null && (b as any)[sortActive.sortField] === null)
          return 0;
        if (sortActive.sortOrder == 'asc')
          return (a as any)[sortActive.sortField] - (b as any)[sortActive.sortField];
        return (b as any)[sortActive.sortField] - (a as any)[sortActive.sortField];
      });
      setData(newData);
      setTableData(newData.slice(0, top));
    });
  }

  const formatYoYChange = (index: number, data: any) => {
    return '+' + (data * 100).toLocaleString('en-us', { maximumFractionDigits: 2 }) + '%';
  };

  const yoyStyles = (data: any) => {
    if (data > 0) return { color: 'green' };
    else if (data < 0) return { color: 'red' };
    return { color: 'black' };
  };

  const columnsYoY = [
    {
      label: '# Ranking',
      accessor: '',
      sortable: false,
      formatter: (index: number, data: any) => index + 1
    },
    { label: 'Language', accessor: 'language_name', sortable: false },
    {
      label: 'YoY Change',
      accessor: 'change',
      sortable: true,
      formatter: formatYoYChange,
      style: yoyStyles
    },
    { label: 'Count', accessor: 'count', sortable: true }
  ];

  const handleSorting = (sortField: string, sortOrder: 'asc' | 'desc') => {
    if (sortField) {
      data.sort((a, b) => {
        if ((a as any)[sortField] === null) return 1;
        if ((b as any)[sortField] === null) return -1;
        if ((a as any)[sortField] === null && (b as any)[sortField] === null) return 0;
        if (sortOrder == 'asc') return (a as any)[sortField] - (b as any)[sortField];
        return (b as any)[sortField] - (a as any)[sortField];
      });
      setTableData(data.slice(0, top));
      setSortActive({ sortField: sortField, sortOrder: sortOrder });
    }
  };

  // Chart params
  const theme = {
    background: '#222222',
    axis: {
      fontSize: '14px',
      tickColor: '#eee',
      ticks: {
        line: {
          stroke: '#555555'
        },
        text: {
          fill: '#ffffff'
        }
      },
      legend: {
        text: {
          fill: '#aaaaaa'
        }
      }
    },
    grid: {
      line: {
        stroke: '#555555'
      }
    }
  };

  return (
    <>
      <div
        style={{
          marginTop: '50px'
        }}>
        <h2>Change Ranking</h2>
        <p>
          A ranking table of programming languages according the YoY Change for <b>commits</b>,{' '}
          <b>pull requests</b> and <b>repositories</b>.
        </p>
        <div
          style={{
            width: '35%',
            display: 'flex',
            flexDirection: 'row',
            justifyContent: 'space-between',
            alignItems: 'stretch'
          }}>
          <p style={{ paddingRight: '10px', verticalAlign: 'middle' }}>Year</p>
          <Select
            className="basic-single"
            classNamePrefix="select"
            onChange={(newYear) => {
              if (newYear) setYear(newYear.value);
            }}
            defaultValue={{ value: year, label: String(year) }}
            isDisabled={false}
            isLoading={false}
            isClearable={false}
            isRtl={false}
            isSearchable={true}
            name="year"
            options={yearSelectOptions}
          />
          <p style={{ paddingRight: '10px', verticalAlign: 'middle' }}>Quarter</p>
          <Select
            className="basic-single"
            classNamePrefix="select"
            onChange={(newQuarter) => {
              if (newQuarter) setQuarter(newQuarter.value);
              else setQuarter(null);
            }}
            defaultValue={null}
            isDisabled={false}
            isLoading={false}
            isClearable={true}
            isRtl={false}
            isSearchable={true}
            name="quarter"
            options={quarterSelectOptions}
          />
          <p style={{ paddingRight: '10px', verticalAlign: 'middle' }}>Event type</p>
          <Select
            className="basic-single"
            classNamePrefix="select"
            onChange={(newEvent) => {
              if (newEvent) setEvent(newEvent.value);
            }}
            defaultValue={datasetSelectOptions[0]}
            isDisabled={false}
            isLoading={false}
            isClearable={false}
            isRtl={false}
            isSearchable={true}
            name="event"
            options={datasetSelectOptions}
          />
        </div>
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr'
          }}>
          <div className="table_container">
            <table className="table">
              <TableHead
                {...{ columns: columnsYoY, handleSorting, defaultSortField: 'yoy_change' }}
              />
              <TableBody {...{ columns: columnsYoY, tableData }} />
            </table>
          </div>
          <div
            style={{
              display: 'flex',
              justifyContent: 'center',
              alignItems: 'center'
            }}>
            <Bar
              width={700}
              height={400}
              margin={{ top: 40, right: 80, bottom: 100, left: 80 }}
              data={tableData as any[]}
              padding={0.2}
              keys={['change']}
              indexBy="language_name"
              valueFormat=" >+p"
              colors={{ scheme: 'spectral' }}
              enableLabel={false}
              labelTextColor="inherit:darker(2.4)"
              labelSkipWidth={8}
              labelSkipHeight={8}
              enableGridX={false}
              colorBy={'indexValue'}
              axisBottom={{
                tickSize: 5,
                tickPadding: 5,
                tickRotation: -90,
                legend: 'Language',
                legendPosition: 'middle',
                legendOffset: 80
              }}
              axisLeft={{
                tickSize: 5,
                tickPadding: 5,
                tickRotation: 0,
                legend: 'YoY Change',
                legendPosition: 'middle',
                legendOffset: -50
              }}
              theme={theme}
            />
          </div>
        </div>
      </div>
    </>
  );
};

export default ChangeRanking;
