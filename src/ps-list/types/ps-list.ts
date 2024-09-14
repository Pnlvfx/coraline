export interface ProcessDescriptor {
  readonly pid: number;
  readonly name: string;
  readonly ppid: number;

  /**
	Not supported on Windows.
	*/
  readonly cmd?: string;

  /**
	Not supported on Windows.
	*/
  readonly cpu?: number;

  /**
	Not supported on Windows.
	*/
  readonly memory?: number;

  /**
	Not supported on Windows.
	*/
  readonly uid?: number;
}

export interface ProcessDescriptorInternal {
  pid: number;
  name: string;
  ppid: number;

  /**
	Not supported on Windows.
	*/
  cmd?: string;

  /**
	Not supported on Windows.
	*/
  cpu?: number;

  /**
	Not supported on Windows.
	*/
  memory?: number;

  /**
	Not supported on Windows.
	*/
  uid?: number;
}
