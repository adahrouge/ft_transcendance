/* ************************************************************************** */
/*                                                                            */
/*                                                        :::      ::::::::   */
/*   main.c                                             :+:      :+:    :+:   */
/*                                                    +:+ +:+         +:+     */
/*   By: adahroug <adahroug@student.42.fr>          +#+  +:+       +#+        */
/*                                                +#+#+#+#+#+   +#+           */
/*   Created: 2025/05/12 18:57:40 by adahroug          #+#    #+#             */
/*   Updated: 2025/05/19 16:37:39 by adahroug         ###   ########.fr       */
/*                                                                            */
/* ************************************************************************** */

#include "cub3d.h"

int main(int argc, char **argv)
{
	t_data *p;
	if (argc != 2)
	{
		error_message("Error, wrong arguments\n");
		exit(EXIT_FAILURE);
	}
	p = malloc(sizeof(t_data));
	if (!p)
		return -1;
	initialize_struct(p);
	p->map_filename = ft_strdup(argv[1]);
	parse_map(p);
	free_allocated(p);
	return 0;
}

void initialize_struct(t_data *p)
{
	p->ceiling_color = NULL;
	p->floor_color = NULL;
	p->north_filename = NULL;
	p->east_filename = NULL;
	p->west_filename = NULL;
	p->south_filename = NULL;
	p->error_message = NULL;
	p->map_content = NULL;
	p->map = NULL;
	p->file_buffer = NULL;
	p->has_no = 0;
	p->has_so = 0;
	p->has_we = 0;
	p->has_ea = 0;
	p->has_ceiling = 0;
	p->has_floor = 0;
	p->position = 0;
	p->x_coordinate = -1;
	p->y_coordinate = -1;
	p->set = 0;
	return ;
}
